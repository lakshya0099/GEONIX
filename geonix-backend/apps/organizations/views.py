from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import status

from .serializers import CompanySignupSerializer
from .serializers import CreateInviteSerializer


class CompanySignupView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        print("DATA RECEIVED:", request.data)  # add this
        serializer = CompanySignupSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Organization created successfully"}, status=status.HTTP_201_CREATED)
        print("ERRORS:", serializer.errors)  # and this
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class CreateInviteView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):

        if request.user.role != "orgadmin":
            return Response(
                {"error": "Only organization admins can invite employees"},
                status=403
            )

        serializer = CreateInviteSerializer(
            data=request.data,
            context={"request": request}
        )

        if serializer.is_valid():
            invite = serializer.save()

            return Response({
                "invite_token": invite.token,
                "expires_at": invite.expires_at
            })

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)