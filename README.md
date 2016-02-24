# React Native scrollview lazyload
ScrollView with image/components lazyload feature. Support all ScrollView feature. Detect ScrollView by 'renderRow' and 'dataSource' props(ListView should be add this props).


# Component Params
| param | type | description |
| --- | --- | --- |
| autoTriggerIsInScreen | boolean | default: false. Is auto trigger isInScreen to elements |
| autoTriggerIsInScreenTime | number | default: 1500. unit: ms |
| lazyExtra | number | default: 1000，Setup lasy load area. (doesn't include screen height) |

# In LazyloadView components params
| 参数名称 | 型态 | 说明 |
| --- | --- | --- |
| lazyloadSrc | string, object | default: none. Image component should be `<Image lazyloadSrc={'URL'}>` or `<Image lazyloadSrc={{uri:'URL'}}>`|
| lazyRender | boolean | default: false. Using lazy reader feature. When components in screen will trigger `setState({ isRendered: true })` for component. Only trigger once. |
| lazyInScreen | boolean | default: false. When components in screen will trigger `setState({ isInScreen: true })`，Only trigger once. |

# how to use
`npm install react-native-scrollview-lazyload --save`

* Lazy load image: `<Image lazyloadSrc={'LOAD_SOURCE'} />`
* Lazy load image: `<Image lazyloadSrc={{src:'LOAD_SOURCE'}} />`
* Lazy load components: `<View lazyRender={true} />`
* Trigger components in screen: `<View lazyInScreen={true} />`
* Lazy load area(default is 1000): `<LazyloadView lazyExtra={1000}></LazyloadView>`

```javascript
var React = require('react-native');
var {
    AppRegistry,
    Text,
    View,
    Image,
    ListView,
} = React;

var LazyComponent = React.createClass({
    getDefaultProps: function() {
        return {
            lazyRender: false
        };
    },
    getInitialState: function() {
        return {
            isRendered: !this.props.lazyRender,
        };
    },
    shouldComponentUpdate: function() {
        // forceRender is dont used lazy render
        if(this.state.isRendered && !this.props.forceRender) {
            return false;
        }

        return true;
    },
    renderLoading: function() {
        return (
            <Text>{'Loading...'}</Text>
        );
    },
    render: function(){
        var content = (<View>{this.props.children}</View>) || null;

        if(!this.state.isRendered && this.props.lazyRender) {
            content = this.renderLoading();
        }

        return (
            <View {...this.props}>
                {content}
            </View>
        );
    },
});

var InScreenComponents = React.createClass({
    shouldComponentUpdate: function() {
        // forceRender is dont used lazy render
        if(this.state.isInScreen) {
            this.setState({ title: 'Is in screen first time'})
        }

        return false;
    },
    render: function(){
        return (
            <View {...this.props}>
                <Text>{this.state.title || 'Never in screen'}</Text>
            </View>
        );
    },
});

var LazyloadView = require('@ali/react-native-lazyloadview');

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



    for(var i = 0 ; i < 100; i++) {
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

    for(var i = 0 ; i < 100; i++) {
        var imageUrl = 'https://placeholdit.imgix.net/~text?txtsize=8&txt=60%C3%9760&w=60&h=60';
        body.push(
            <View style={rowStyle} ref={'row'+i}>
                <Image
                    lazyloadSrc={imageUrl}
                    style={imgStyle}
                    />
                <Text>Row: {i}</Text>
                <LazyComponent>
                    <Image source={{uri: imageUrl}}>
                </LazyComponent>
                <InScreenComponents></InScreenComponents>
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