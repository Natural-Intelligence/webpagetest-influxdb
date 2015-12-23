echo "Using folder $WORKSPACE/webpagetest. Testing build $BUILD_NUMBER"

cd $WORKSPACE/webpagetest # Jenkins workspace, then change dir into webpagetest folder
npm install

export BUILDNUMBER=$BUILD_NUMBER # Jenkins build number
export TESTURL="http://your-base-url-to-test/" # Or read it from som config i.e from build config in json-format: $(node ./read-json-config.js $TEMP/build-cfg.json TestUrl)

if [ -z "$TESTURL" ]; then
    echo "Could not find required TestUrl parameter in file $TEMP/build-cfg.json. Please review. Aborting webpagetest."
    echo $(cat $TEMP/build-cfg.json)
    exit 1
fi

# Runs the webpagtest for a single page. Kan be expanded by adding one test pr line 
# NOTE: - means no API key. Add your own API key to web page test here if needed, otherwise use your own local webpagetest servers
./run-tests.sh $TESTURL/your-page-to-test -
