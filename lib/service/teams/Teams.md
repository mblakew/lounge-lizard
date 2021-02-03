# Secrets
> If it does not exist, generate a `secrets.json` with the following contents in the `service/teams` directory.
## secrets.json
```json
{
  "client_id": "your_client_id",
  "auth_uri": "https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id={{client_id}}&response_type=code&redirect_uri=https://teams.microsoft.com/go&response_mode=query&scope={{scope}}&state=d0a98567-5920-48a4-98d6-154eb6a3da3d",
  "client_secret": "your_secret_goes_here",
  "scope": [
    "user.read",
    "offline_access",
    "openid",
    "profile",
    "email",
    "chat.readwrite",
    "presence.read.all"
  ]
}

```