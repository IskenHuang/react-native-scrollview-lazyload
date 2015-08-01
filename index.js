'use strict';

var React = require('react-native');

var {
    ScrollView,
} = React;

var RCTUIManager = require('NativeModules').UIManager;

var ScrollViewComponent = React.createClass({

    _ref: 'scrollview',

    _toLoadImages: true,

    _merge: function(originObj, replaceObj) {
        for(var i in replaceObj) {
            originObj[i] = replaceObj[i];
        }

        return originObj;
    },

    loadVisibleImages: function(){
        if(!this._toLoadImages) {
            return;
        }

        requestAnimationFrame(() => {
            var scrollView = this.getScrollResponder();
            if(scrollView){
                var scrollInner = scrollView._reactInternalInstance._renderedComponent._renderedChildren['.0'];
                if(__DEV__){
                    scrollInner = scrollInner._renderedComponent;
                }
                //traverse scroll contents
                this._traverseAllChildren(scrollInner._renderedChildren);
            }
        });
    },

    _traverseAllChildren: function(children){
        for(var i in children){
            var child = children[i],
                renderedComponent = child._renderedComponent;

            if(!renderedComponent || typeof child._currentElement === 'string'){
                if(child._renderedChildren){
                    this._traverseAllChildren(child._renderedChildren);
                }
                continue;
            }

            if(child._currentElement.type.displayName === 'Image' || child._currentElement._store.props.lazyloadSrc) {
                this._checkImageToLoad(renderedComponent);
            }

            while(renderedComponent){
                if(renderedComponent._renderedChildren){
                    this._traverseAllChildren(renderedComponent._renderedChildren);
                    break;
                }else{
                    renderedComponent = renderedComponent._renderedComponent;
                }
            }
        }
    },

    _checkImageToLoad: function(instance){
        var renderedComponent = instance._renderedComponent || instance,
            elem = renderedComponent._currentElement,
            lazyloadSrc = elem.props.lazyloadSrc,
            instance = elem._owner._instance;

        // image is loaded
        if(lazyloadSrc && !instance.props.isLoaded){
            var scrollView = this.getScrollResponder();

            RCTUIManager.measureLayout(
                React.findNodeHandle(instance),
                scrollView.getInnerViewNode(),
                null,
                (left, top, width, height) => {
                    var scrollY = this.scrollProperties.offsetY || 0;

                    //check Image is visible
                    if(top + height > scrollY && top < scrollY + this.scrollProperties.visibleHeight){
                        instance.props.source = {
                            uri: instance.props.lazyloadSrc
                        };
                        instance.props.isLoaded = true;
                        instance.setState(instance.state || {});
                    }
                }
            );
        }
    },

    getDefaultProps: function() {
        return {
            scrollEventThrottle: 50,
            _onMomentumScrollDelay: 400,
        };
    },

    componentWillMount: function(){
        this.scrollProperties = {
            contentHeight: 0,
            visibleHeight: 0,
            offsetY: 0,
        };
    },

    componentDidMount: function(){
        //TODO: 'ListView' also has this code
        requestAnimationFrame(() => {
            this._measureScrollProperties();
        });
    },

    _measureScrollProperties: function(){
        var scrollView = this.getScrollResponder();

        RCTUIManager.measureLayout(
            scrollView.getInnerViewNode(),
            React.findNodeHandle(scrollView),
            null,
            (left, top, width, height) => {
                this.scrollProperties.contentHeight = height;
            }
        );

        RCTUIManager.measureLayoutRelativeToParent(
            React.findNodeHandle(scrollView),
            null,
            (left, top, width, height) => {
                this.scrollProperties.visibleHeight = height;
                this.loadVisibleImages();
            }
        );
    },

    // check is ListView or ScrollView
    getScrollResponder: function(){
        var scrollView = this.refs[this._ref];
        return scrollView && scrollView.getScrollResponder ? scrollView.getScrollResponder() : scrollView;
    },

    _renderHeader: function(){
        var header = this.props._renderHeader ? this.props._renderHeader() : {};
        return header;
    },

    render: function(){
        var props = this._merge(this.props, {
            onScroll: this._onScroll,
            // onTouchStart: this._onTouchStart,
            // onTouchEnd: this._onTouchEnd,
            onScrollEndDrag: this._onScrollEndDrag,
            onMomentumScrollBegin: this._onMomentumScrollBegin,
            onMomentumScrollEnd: this._onMomentumScrollEnd,
            renderHeader: this._renderHeader,
        });

        var ScrollClass = this.props.scrollClass || ScrollView;
        var content = null;
        if(ScrollClass === ScrollView){
            content = [this._renderHeader(), this.props.children];
        }

        return (
            <ScrollClass
                {...props}
                ref={this._ref}>
                {content}
            </ScrollClass>
        );
    },

    _onScroll: function(e){
        var scrollProperties = this.scrollProperties;
        scrollProperties.visibleHeight = e.nativeEvent.layoutMeasurement.height;
        scrollProperties.contentHeight = e.nativeEvent.contentSize.height;
        scrollProperties.offsetY = e.nativeEvent.contentOffset.y;

        // `onEndReached` polyfill for ScrollView
        if(this.props.onEndReached && this.props.scrollClass !== ListView){
            var onEndReached_Threshold = this.props.onEndReachedThreshold || 1000;
            var nearEnd = scrollProperties.contentHeight - scrollProperties.visibleHeight - scrollProperties.offsetY < onEndReachedThreshold;
            if(nearEnd && scrollProperties.contentHeight !== this._sentEndForContentHeight){
                this._sentEndForContentHeight = scrollProperties.contentHeight;
                this.props.onEndReached(e);
            }
        }

        this.loadVisibleImages();

        this.props._onScroll && this.props._onScroll(e);
    },

    // _onTouchStart: function(e){
    //     this.props._onTouchStart && this.props._onTouchStart(e);
    // },

    // _onTouchEnd: function(e){
    //     this.props._onTouchEnd && this.props._onTouchEnd(e);
    // },

    _onScrollEndDrag: function(e){
        this._loadId && clearTimeout(this._loadId);
        this._loadId = setTimeout(() => {
            this._loadId = null;
            this._toLoadImages = true;
        }, this.props._onMomentumScrollDelay);

        this.props._onScrollEndDrag && this.props._onScrollEndDrag(e);
    },

    _onMomentumScrollBegin: function(e){
        this._toLoadImages = false;

        this.props._onMomentumScrollBegin && this.props._onMomentumScrollBegin(e);
    },

    _onMomentumScrollEnd: function(e){
        this.loadVisibleImages();

        this.props._onMomentumScrollEnd && this.props._onMomentumScrollEnd(e);
    },
});


module.exports = ScrollViewComponent;