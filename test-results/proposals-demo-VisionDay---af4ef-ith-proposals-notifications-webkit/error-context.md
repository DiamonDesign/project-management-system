# Page snapshot

```yaml
- generic [ref=e2]:
  - region "Notifications (F8)":
    - list
  - region "Notifications alt+T"
  - generic [ref=e3]:
    - generic [ref=e4]:
      - heading "Bienvenido" [level=1] [ref=e5]
      - generic [ref=e8]:
        - generic [ref=e9]:
          - generic [ref=e10]:
            - generic [ref=e11]: Email address
            - textbox "Email address" [ref=e12]
          - generic [ref=e13]:
            - generic [ref=e14]: Your Password
            - textbox "Your Password" [ref=e15]
        - button "Sign in" [ref=e16] [cursor=pointer]
        - generic [ref=e17]:
          - link "Forgot your password?" [ref=e18]:
            - /url: "#auth-forgot-password"
          - link "Don't have an account? Sign up" [ref=e19]:
            - /url: "#auth-sign-up"
    - link "Made with Dyad" [ref=e21]:
      - /url: https://www.dyad.sh/
```