# React Native scrollview lazyload
ScrollView/ListView with image lazyload feature. Support all ScrollView/ListView feature. Detect ScrollView/ListView by 'renderRow' and 'dataSource' props(ListView should be add this props).


# how to use
`npm install react-native-scrollview-lazyload --save`

```javascript
var React = require('react-native');
var {
    AppRegistry,
    Text,
    View,
    Image,
    ListView,
} = React;

var LazyloadView = require('react-native-scrollview-lazyload');

...

render: function() {
    // ListView
    var body = [],
        rowStyle = {
            flex:1,
            height: 60,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
        },
        renderElement = function(d){
            return (
                <View style={rowStyle} ref={d.ref}>
                    <Image
                        lazyloadSrc={d.img}
                        style={{
                            width: 60,
                            height: 60,
                            position: 'absolute',
                            left: 0,
                        }}
                        />
                    <Text>Row: {d.index}</Text>
                </View>
            );
        };



    for(var i = 0 ; i < 500; i++) {
        body.push({
            ref: 'row' + i,
            img: 'https://placeholdit.imgix.net/~text?txtsize=8&txt=60%C3%9760&w=60&h=60',
            index: i,
        });
    }

    return (
        <LazyloadView
            contentInset={{top: 0, bottom: 20}}
            dataSource={this.props.dataSource.cloneWithRows(body)}
            renderRow={(rowData, sectionID, rowID, highlightRow) => {
                // console.log('renderRow = ', rowData, rowID);
                return renderElement(rowData);
            }}
            _onScroll={(e) => {
                console.log('_onScroll = ', e.nativeEvent);
            }}
        ></LazyloadView>
    );


    // ScrollView
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
        <LazyloadView
            _onScroll={(e) => {

            }}>
            _onScrollEndDrag={(e) => {

            }}
            _renderHeader={(e) => {
                // when add this props please return something
                return (<Text>HEADER</Text>);
            }}
            {body}
        </LazyloadView>
    );
},

```