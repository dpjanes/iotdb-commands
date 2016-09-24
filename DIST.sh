#
#   DIST.sh
#
#   David Janes
#   IOTDB
#   2016-01-09
#

PACKAGE=iotdb-commands
DIST_ROOT=/var/tmp/.dist.$$

if [ ! -d "$DIST_ROOT" ]
then
    mkdir "$DIST_ROOT"
fi

echo "=================="
echo "NPM Packge: $PACKAGE"
echo "=================="
(
    NPM_DST="$DIST_ROOT/$PACKAGE"
    echo "NPM_DST=$NPM_DST"

    if [ -d ${NPM_DST} ]
    then
        rm -rf "${NPM_DST}"
    fi
    mkdir "${NPM_DST}" || exit 1

    update-package --increment-version --package "$PACKAGE" || exit 1

    tar cf - \
        --exclude "node_modules" \
        --exclude "xxx*" \
        --exclude "yyy*" \
        --exclude "Gruntfile.js" \
        README.md LICENSE \
        package.json homestar.json \
        index.js \
        lib/*.js \
        commands/*.js \
        vocabulary/*.yaml \
        |
    ( cd "${NPM_DST}" && tar xvf - && npm publish ) || exit 1
    git commit -m "new release" package.json || exit 1
    git push || exit 1

    echo "end"
)
