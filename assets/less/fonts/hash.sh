# create hash for versioning
hash="$(md5sum ./font.less | awk '{ print $1 }')"
echo "var fontHash = '$hash';" > ../../js/fontHash.js