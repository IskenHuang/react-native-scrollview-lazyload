# React Native scrollview lazyload
ScrollView with image lazyload feature.

# how to use
`npm install react-native-scrollview-lazyload --save`

```javascript
var ScrollView = require('react-native-scrollview-lazyload');

...

render: function() {
    var body = [],
        rowStyle = {
            flex:1,
            height: 60,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
        },
        imgStyle = {
            width: 60,
            height: 60,
            position: 'absolute',
            left: 0,
        };

    for(var i = 0 ; i < 500; i++) {
        body.push(
            <View style={rowStyle} ref={'row'+i}>
                <Image
                    lazyloadSrc={'https://placeholdit.imgix.net/~text?txtsize=8&txt=60%C3%9760&w=60&h=60'}
                    style={imgStyle}
                    />
                <Text>Row: {i}</Text>
            </View>
        );
    }

    return (
        <ScrollView
            _onScroll={(e) => {

            }}>
            _onScrollEndDrag={(e) => {

            }}
            _renderHeader={(e) => {
                // when add this props please return something
                return (<Text>HEADER</Text>);
            }}
            {body}
        </ScrollView>
    );
},

```