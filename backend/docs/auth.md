# Authentication

The site admin logs in with a JSON Web Token (JWT), using
[djoser](https://djoser.readthedocs.io/) and
[Simple JWT](https://django-rest-framework-simplejwt.readthedocs.io/). The
routes live in the `accounts` app ([`accounts/urls.py`](../accounts/urls.py)).
There is no signup: the admin account is created on the server.

```bash
pipenv run python manage.py createsuperuser
```

Only **staff** users can log in; any other account gets the same `401` as a
wrong password ([`accounts/serializers.py`](../accounts/serializers.py)).

## Endpoints

Paths are relative to `/api/v1/auth/`:

| Method | Path | Body | Response |
|---|---|---|---|
| `POST` | `jwt/create/` | `{"username", "password"}` | `200` `{"access", "refresh"}` (login) |
| `POST` | `jwt/refresh/` | `{"refresh"}` | `200` `{"access", "refresh"}`: a new pair |
| `POST` | `jwt/verify/` | `{"token"}` | `200` `{}` if the token is valid |
| `POST` | `jwt/blacklist/` | `{"refresh"}` | `200` `{}` (logout) |
| `GET` | `users/me/` | | `200` `{"id", "username", "email"}` |
| `POST` | `users/set_password/` | `{"current_password", "new_password"}` | `204` |

An invalid or expired token, or a missing one on a route that needs it, is a
`401`. A rejected new password (see Django's password validators) or a wrong
current password is a `400`.

## Using the tokens

Send the access token in the `Authorization` header:

```http
GET /api/v1/auth/users/me/
Authorization: Bearer <access>
```

| Token | Lifetime | Use |
|---|---|---|
| Access | 15 minutes | Sent with every authenticated request |
| Refresh | 1 day | Exchanged at `jwt/refresh/` for a new pair |

- **Refresh tokens are single-use.** Each refresh returns a new refresh token
  and blacklists the old one, so the frontend must store the new one.
- **Logging out** blacklists the refresh token. The access token keeps working
  until it expires (15 minutes at most), so the frontend should drop it too.
- **Don't send an expired token to public routes.** JWT authentication checks
  every `Authorization` header it gets, so a bad token is a `401` even on
  `/api/v1/experience/`, which needs no token.

Lifetimes and rotation are set in `SIMPLE_JWT` in
[`portfolio/settings.py`](../portfolio/settings.py).

## Adding password reset later

djoser also offers signup, activation and password reset, but only the routes
above are exposed, and any other `users/` route is a `404`. To add password
reset by email:

1. Route `users/reset_password/` and `users/reset_password_confirm/` to
   djoser's `UserViewSet` (`reset_password` and `reset_password_confirm`
   actions) in [`accounts/urls.py`](../accounts/urls.py).
2. Set `DJOSER = {"PASSWORD_RESET_CONFIRM_URL": "<frontend path>/{uid}/{token}"}`.
3. Set up a real email backend in place of the console one.

No migration is needed.
