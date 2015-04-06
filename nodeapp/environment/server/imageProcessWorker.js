/**
 * Created by tsarpf on 4/6/15.
 */


process.on('message', function(msg) {
    console.log('msg received at worker ' + msg);
    process.send(msg);
});