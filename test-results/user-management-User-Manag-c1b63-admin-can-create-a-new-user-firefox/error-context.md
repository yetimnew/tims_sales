# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e4]:
    - link "Laravel" [ref=e6] [cursor=pointer]:
      - /url: /
      - img [ref=e7]
      - text: Laravel
    - blockquote [ref=e10]:
      - paragraph [ref=e11]: “Simplicity is the essence of happiness.”
      - contentinfo [ref=e12]: Cedric Bledsoe
  - generic [ref=e14]:
    - generic [ref=e15]:
      - heading "Log in to your account" [level=1] [ref=e16]
      - paragraph [ref=e17]: Enter your email and password below to log in
    - generic [ref=e19]:
      - generic [ref=e20]:
        - generic [ref=e21]: Email address
        - textbox "Email address" [ref=e22]:
          - /placeholder: email@example.com
          - text: admin@test.com
      - generic [ref=e23]:
        - generic [ref=e24]:
          - generic [ref=e25]: Password
          - link "Forgot password?" [ref=e26] [cursor=pointer]:
            - /url: /forgot-password
        - textbox "Password" [active] [ref=e27]: password123
      - generic [ref=e28]:
        - checkbox "Remember me" [ref=e29]
        - checkbox
        - generic [ref=e30]: Remember me
      - button "Log in" [ref=e31]
```