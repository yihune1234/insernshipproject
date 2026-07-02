from rest_framework_simplejwt.tokens import RefreshToken


class TokenService:
    @classmethod
    def issue_tokens(cls, user):
        refresh = RefreshToken.for_user(user)
        
        # Add custom claims for role and identity reference
        refresh['role'] = user.role
        refresh['user_id'] = str(user.id)
        
        # These claims will be included in both access and refresh tokens
        access = refresh.access_token
        access['role'] = user.role
        access['user_id'] = str(user.id)
        
        return {
            "access": str(access),
            "refresh": str(refresh),
        }
