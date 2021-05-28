
# Running HTTPS local server
`http-server -S -C localhost+2.pem -K localhost+2-key.pem`

https using mkcert (https://web.dev/how-to-use-local-https/)

Mobile devices (from https://github.com/FiloSottile/mkcert#mobile-devices)
For the certificates to be trusted on mobile devices, you will have to install the root CA. It's the rootCA.pem file in the folder printed by mkcert -CAROOT.

On iOS, you can either use AirDrop, email the CA to yourself, or serve it from an HTTP server. After opening it, you need to install the profile in Settings > Profile Downloaded and then enable full trust in it.

For Android, you will have to install the CA and then enable user roots in the development build of your app. See this StackOverflow answer.

Nice ressource:
https://turfjs.org/docs/#toMercator 
