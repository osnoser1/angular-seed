#!/bin/bash

if ! [ -x "$(command -v docker-compose)" ]; then
  echo 'Error: docker-compose is not installed.' >&2
  exit 1
fi

ifs=' ' read -r -a domains <<< "$DOMAINS"
export NGINX_HOST=${domains[0]}
rsa_key_size=4096
data_path="../data/certbot"
email="" # Adding a valid address is strongly recommended
staging=0 # Set to 1 if you're testing your setup to avoid hitting request limits
first_time=0

if [ ! -d "$data_path" ]; then
  echo "### Commenting on the SSL related directives in configuration..."
  first_time=1
  mkdir -p {"$data_path/www","$data_path/conf"}
  openssl dhparam -out "$data_path/dhparam.pem" 2048
  sed -i -r 's/(listen .*443)/\1;#/g; s/(ssl_(certificate|certificate_key|trusted_certificate) )/#;#\1/g' ./nginx/sites-available/example.com.conf
  echo
fi


echo "### Copy Diffie-Hellman parameter for DHE ciphersuites"
cp "$data_path/dhparam.pem" ./nginx/
echo


echo "### Starting nginx ..."
docker-compose up --force-recreate --build --remove-orphans -d web-app
echo


if [ $first_time != "1" ]; then
  exit 0
fi


echo "### Requesting Let's Encrypt certificate for $domains ..."
#Join $domains to -d args
domain_args=""
for domain in "${domains[@]}"; do
  domain_args="$domain_args -d $domain"
done

# Select appropriate email arg
case "$email" in
  "") email_arg="--register-unsafely-without-email" ;;
  *) email_arg="--email $email" ;;
esac

# Enable staging mode if needed
if [ $staging != "0" ]; then staging_arg="--staging"; fi

docker-compose run --rm --entrypoint "\
  certbot certonly --webroot -w /var/www/_letsencrypt \
    $staging_arg \
    $email_arg \
    $domain_args \
    --rsa-key-size $rsa_key_size \
    --agree-tos \
    --force-renewal" certbot
echo


echo "### Reloading nginx ..."
docker-compose exec -T web-app sed -i -r 's/#?;#//g' "/etc/nginx/sites-available/$NGINX_HOST.conf"
docker-compose exec -T web-app nginx -s reload
