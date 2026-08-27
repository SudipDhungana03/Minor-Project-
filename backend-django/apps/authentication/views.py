import json
import random
import re
from pathlib import Path
import requests
from django.core.mail import send_mail
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from .serializers import RegisterSerializer, ProfileSerializer
from rest_framework.generics import RetrieveUpdateAPIView
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()
UNIVERSITY_DATA_URL = 'https://raw.githubusercontent.com/Hipo/university-domains-list/master/world_universities_and_domains.json'
UNIVERSITY_DATA_FILE = Path(__file__).resolve().parent / 'data' / 'world_universities_and_domains.json'
_university_directory = None


def _load_university_directory():
    """Load the bundled worldwide directory, refreshing only if it is absent."""
    global _university_directory
    if _university_directory is not None:
        return _university_directory

    try:
        records = json.loads(UNIVERSITY_DATA_FILE.read_text(encoding='utf-8'))
    except (OSError, ValueError):
        try:
            response = requests.get(UNIVERSITY_DATA_URL, timeout=20)
            response.raise_for_status()
            records = response.json()
            UNIVERSITY_DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
            UNIVERSITY_DATA_FILE.write_text(json.dumps(records), encoding='utf-8')
        except (requests.RequestException, ValueError, OSError):
            records = []

    _university_directory = tuple(
        record.get('name', '').strip() for record in records if record.get('name', '').strip()
    )
    return _university_directory


def _university_initials(name):
    ignored_words = {'and', 'at', 'by', 'for', 'in', 'of', 'the', 'to'}
    words = re.findall(r'[a-z0-9]+', name.casefold())
    return ''.join(word[0] for word in words if word not in ignored_words)


def _university_match_rank(name, search):
    normalized_name = name.casefold()
    initials = _university_initials(name)
    if normalized_name == search:
        return 0
    if normalized_name.startswith(search):
        return 1
    if initials.startswith(search):
        return 2
    if search in normalized_name:
        return 3
    return 4

# --- Registration View ---
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(
            {"message": "Registration successful! Please verify your email."}, 
            status=status.HTTP_201_CREATED
        )

# --- NEW: Send Verification Code ---
class SendVerificationView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        email = request.data.get('email')
        print(f"DEBUG SendVerificationView received: {request.data}")
        try:
            # case-insensitive lookup to avoid email case mismatch
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        code = str(random.randint(100000, 999999))
        user.verification_code = code
        user.save()
        send_mail('Verification Code', f'Your code is {code}', 'noreply@project.com', [email])
        return Response({"message": "Code sent"})

# --- NEW: Verify Code ---
class VerifyCodeView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        # Debug the incoming payload
        print(f"DEBUG VerifyCodeView received: {request.data}")
        email = request.data.get('email')
        code = request.data.get('code')

        if not email or not code:
            return Response({"error": "email and code are required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        if str(user.verification_code) == str(code):
            user.is_verified = True
            user.save()

            # Issue JWT tokens so frontend can authenticate immediately
            refresh = RefreshToken.for_user(user)
            return Response({
                "message": "Verification successful!",
                "access": str(refresh.access_token),
                "refresh": str(refresh)
            })

        return Response({"error": "Invalid code"}, status=status.HTTP_400_BAD_REQUEST)

# --- Dashboard View ---
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_view(request):
    return Response({
        "message": "Access Granted",
        "username": request.user.username,
        "role": request.user.role
    }, status=status.HTTP_200_OK)

# --- Organization directory ---
@api_view(['GET'])
@permission_classes([AllowAny])
def organization_list_view(request):
    """Search locally saved names and the cached worldwide university list."""
    search = request.query_params.get('search', '').strip()[:120]
    local_organizations = User.objects.exclude(organization__isnull=True).exclude(organization__exact='')
    if search:
        local_organizations = local_organizations.filter(organization__icontains=search)

    names = {name.strip() for name in local_organizations.values_list('organization', flat=True) if name.strip()}
    normalized_search = search.casefold()
    if len(normalized_search) >= 2:
        for university in _load_university_directory():
            if _university_match_rank(university, normalized_search) < 4:
                names.add(university)

        # OpenAlex fills gaps in the open university-domain list, including
        # institutions commonly searched by their acronyms (such as IIT).
        try:
            response = requests.get(
                'https://api.openalex.org/institutions',
                params={'search': search, 'per-page': 25},
                timeout=5,
            )
            response.raise_for_status()
            for institution in response.json().get('results', []):
                if institution.get('type') != 'education':
                    continue
                name = (institution.get('display_name') or '').strip()
                if name:
                    names.add(name)
        except (requests.RequestException, ValueError):
            pass

    ranked_names = sorted(
        names,
        key=lambda name: (_university_match_rank(name, normalized_search), name.casefold()),
    ) if normalized_search else sorted(names, key=str.casefold)
    return Response({'organizations': ranked_names[:50]})


# --- NEW: Update Profile View ---
class UpdateProfileView(RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ProfileSerializer

    def get_object(self):
        # This ensures the user can only view/update their own profile
        return self.request.user