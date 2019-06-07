#! /bin/bash

BUCKET=$1
echo "Sync files to $BUCKET"
aws s3 sync src/ s3://$BUCKET/ --delete
aws s3 cp src/sw.js s3://$BUCKET/sw.js --metadata '{"Cache-Control":"max-age=0"}'