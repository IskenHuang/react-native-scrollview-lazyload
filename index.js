'use strict';

var React = require('react-native');

var {
    ScrollView,
    NativeModules,
} = React;

var RCTUIManager = NativeModules.UIManager;

var ScrollViewComponent = React.createClass({

    mixins:[React.addons.PureRenderMixin],

    _toLoadImages: true,

    _merge: function(originObj, replaceObj) {
        for(var i in replaceObj) {
            originObj[i] = replaceObj[i];
        }

        return originObj;
    },

    loadVisibleImages: function(){
        // start auto trigger isInScreen
        this.autoTriggerIsInScreenStart();

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

    _traverseAllChildren: function(children) {
        var _this = this;

        for(var i in children){
            var child = children[i],
                renderedComponent = child._renderedComponent;

            if(!renderedComponent || typeof(child._currentElement) === 'string'){
                if(!__DEV__ && child._renderedChildren) {
                    this._traverseAllChildren(child._renderedChildren);
                }
                continue;
            }

            if(child._instance.props.lazySkip === true) {
                continue;
            }

            // trigger only once
            if(child._instance.props.lazyInScreen === true) {
                if(!child._instance.state || !!!child._instance.state.isInScreen) {
                    _this._renderedLazyInScreen(child);
                }
            }

            // trigger only once
            if(child._instance.props.lazyRender === true && !child._instance.state.isRendered) {
                _this._renderedLazyComponent(child);
                continue;
            }

            if(child._instance.props.lazyloadSrc && (!child._instance.state || !child._instance.state.isLoaded)) {
                _this._checkImageToLoad(renderedComponent, child);
                continue;
            }

            // when elements doesn't in screen skip children
            while(renderedComponent) {
                if(renderedComponent._renderedChildren) {
                    _this._traverseAllChildren(renderedComponent._renderedChildren);
                    break;
                }else{
                    renderedComponent = renderedComponent._renderedComponent;
                }
            }
        }
    },

    _checkImageToLoad: function(instance, component){
        var renderedComponent = instance._renderedComponent || instance,
            elem = renderedComponent._currentElement,
            lazyloadSrc = elem.props.lazyloadSrc,
            instance = elem._owner._instance;

        // image is loaded
        if(lazyloadSrc && (!instance.state || !instance.state.isLoaded)){
            var scrollView = this.getScrollResponder(),
                scrollY = this.scrollProperties.offsetY || 0;

            this.getPosition(scrollView, instance, scrollY)
                .then((res) => {
                    if(res && res.isInScreen) {
                        var lazySrc = instance.props.lazyloadSrc,
                            src = {uri: ''};

                        if(Object.prototype.toString.call(lazySrc) === '[object String]'){
                            src = {
                                uri: lazySrc
                            };
                        }else if(Object.prototype.toString.call(lazySrc) === '[object Object]'){
                            src = {
                                uri: (lazySrc.uri) ? lazySrc.uri : ''
                            };
                        }

                        component._setPropsInternal({source: src});
                        instance.setState({
                            isLoaded: true
                        });
                    }
                });
        }
    },

    _renderedLazyComponent: function(instance) {
        var instance = instance._instance;

        if(instance.props.lazyRender === true && !instance.state.isRendered) {
            var scrollView = this.getScrollResponder(),
                scrollY = this.scrollProperties.offsetY || 0;

            // using cache
            // disable it. because sometime can not control floor height. calc ti every time

            this.getPosition(scrollView, instance, scrollY)
                .then((res) => {
                    if(res) {
                        instance.cachePosition = res.cachePosition;
                        instance.setState({
                            isRendered: res.isInScreen
                        });
                    }
                });
        }
    },

    _renderedLazyInScreen: function(instance) {
        var instance = instance._instance;

        if(instance.props.lazyInScreen === true) {
            if(!instance.state || !!!instance.state.isInScreen) {
                var scrollView = this.getScrollResponder(),
                    pos = instance.cachePosition,
                    scrollY = this.scrollProperties.offsetY || 0;

                // using cache
                // disable it. because sometime can not control floor height. calc ti every time
                if(pos && instance.state && this.checkInScreen(pos)) {
                    instance.setState({
                        isInScreen: true,
                    });
                    return;
                }

                this.getPosition(scrollView, instance, scrollY)
                    .then((res) => {
                        if(res) {
                            instance.cachePosition = res.cachePosition;
                            instance.setState({
                                isInScreen: res.isInScreen
                            });
                        }
                    });
            }
        }
    },

    getPosition: function(scrollView, instance, scrollY) {
        scrollView = scrollView || this.getScrollResponder();
        var _this = this,
            scrollProperties = this.scrollProperties;

        return new Promise(function(resolve, reject) {
            try {
                RCTUIManager.measureLayout(
                    React.findNodeHandle(instance),
                    scrollView.getInnerViewNode(),
                    null,
                    (left, top, width, height) => {
                        var cachePos = {
                                left: left,
                                top: top,
                                width: width,
                                height: height,
                            };

                        resolve({
                            isInScreen: _this.checkInScreen(cachePos),
                            cachePosition: cachePos
                        });
                    }
                );
            }catch (e) {
                reject(null);
            }
        });
    },

    checkInScreen: function(pos) {
        var _left = pos.left,
            _top = pos.top,
            _width = pos.width,
            _height = pos.height;

        var _isInScreen = false,
            scrollProperties = this.scrollProperties,
            scrollY = scrollProperties.offsetY || 0,
            screenTop = scrollY - this.props.lazyExtra,
            screenBottom = scrollY + scrollProperties.visibleHeight + this.props.lazyExtra;

        //check Image is visible
        if(_top + _height > screenTop && _top < screenBottom){
            _isInScreen = true;
        }

        return _isInScreen;
    },

    getDefaultProps: function() {
        return {
            ref: 'lazyloadView',
            scrollEventThrottle: 80,
            _onMomentumScrollDelay: 400,
            _onScrollEndDelay: 100,
            lazyExtra: 1000,
            autoTriggerIsInScreenTime: 1500,
            autoTriggerIsInScreen: false,
            renderHeader: function(){ return null; },
            renderFooter: function(){ return null; },
        };
    },

    componentWillMount: function(){
        this.scrollProperties = {
            contentHeight: 0,
            visibleHeight: 0,
            offsetY: 0,
        };

        this.autoTriggerIsInScreenEnd = false;
    },

    componentDidMount: function(){
        this._reactInternalInstance._setPropsInternal({
            onScroll: this._onScroll,
            onScrollEndDrag: this._onScrollEndDrag,
            onMomentumScrollBegin: this._onMomentumScrollBegin,
            onMomentumScrollEnd: this._onMomentumScrollEnd,
        });

        requestAnimationFrame(() => {
            this._measureScrollProperties();

            // when init trigger once
            this.loadVisibleImages();
        });

        this.autoTriggerIsInScreenStart();
    },

    _measureScrollProperties: function(){
        var scrollView = this.getScrollResponder();
        try {
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

        }catch (e) {}
    },

    // check is ListView or ScrollView
    getScrollResponder: function(){
        var scrollView = this.refs[this.props.ref];
        return scrollView && scrollView.getScrollResponder ? scrollView.getScrollResponder() : scrollView;
    },

    render: function(){
        var content = [
                this.props.renderHeader(),
                this.props.children,
                this.props.renderFooter(),
            ],
            LazyloadView = ScrollView;

        return (
            <LazyloadView
                {...this.props}
                ref={this.props.ref}>
                {content}
            </LazyloadView>
        );
    },

    _onScroll: function(e){
        var scrollProperties = this.scrollProperties;
        scrollProperties.visibleHeight = e.nativeEvent.layoutMeasurement.height;
        scrollProperties.contentHeight = e.nativeEvent.contentSize.height;
        scrollProperties.offsetY = e.nativeEvent.contentOffset.y;

        this.lastScrollEvent = e.nativeEvent;

        // `onEndReached` polyfill for ScrollView
        if(this.props.onEndReached){
            var onEndReached_Threshold = this.props.onEndReachedThreshold || 1000;
            var nearEnd = scrollProperties.contentHeight - scrollProperties.visibleHeight - scrollProperties.offsetY < onEndReachedThreshold;
            if(nearEnd && scrollProperties.contentHeight !== this._sentEndForContentHeight){
                this._sentEndForContentHeight = scrollProperties.contentHeight;
                this.props.onEndReached(e);
            }
        }

        this.loadVisibleImages();

        this.props._onScroll && this.props._onScroll(e);

        this._scrollEndTimer && clearTimeout(this._scrollEndTimer);
        this._scrollEndTimer = setTimeout(() => {
            this._scrollEndTimer = null;
            this.props.onScrollEnd && this.props.onScrollEnd(e);
        }, this.props._onScrollEndDelay);
    },

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

    // auto pre trigger isInScreen:: start
    autoTriggerIsInScreenStart: function() {
        if(this.props.autoTriggerIsInScreen) {
            if(this.autoTriggerIsInScreenEnd) {
                return;
            }

            // stop when timer is running
            this.autoTriggerIsInScreenStop();

            this.autoTriggerIsInScreenTimer = setTimeout(() => {
                try {
                    var scrollView = this.getScrollResponder();

                    if(scrollView){
                        var scrollInner = scrollView._reactInternalInstance._renderedComponent._renderedChildren['.0'];

                        if(__DEV__){
                            scrollInner = scrollInner._renderedComponent;
                        }

                        //traverse scroll contents
                        var children = scrollInner._renderedChildren,
                            isHasInScreenEl = false;

                        for(var i in children) {
                            var child = children[i],
                                renderedComponent = child._renderedComponent;

                            if(!renderedComponent || typeof child._currentElement === 'string'){
                                continue;
                            }

                            // trigger only once
                            if(child._instance.props.lazyInScreen === true) {
                                if(!child._instance.state || !!!child._instance.state.isInScreen) {

                                    isHasInScreenEl = true;

                                    child._instance.setState({
                                        isInScreen: true,
                                    });
                                    break;
                                }
                            }
                        }

                        // when is End don't run this again
                        if(isHasInScreenEl) {
                            this.autoTriggerIsInScreenStart();
                        }else {
                            this.autoTriggerIsInScreenEnd = true;
                        }
                    }
                } catch(e) {}
            }, this.props.autoTriggerIsInScreenTime);
        }
    },

    // auto pre trigger isInScreen:: stop
    autoTriggerIsInScreenStop: function() {
        if(this.props.autoTriggerIsInScreen) {
            if(this.autoTriggerIsInScreenTimer) {
                clearTimeout(this.autoTriggerIsInScreenTimer);
                this.autoTriggerIsInScreenTimer = null;
            }
        }
    },

    // force load images/ components
    refresh: function() {
        this.loadVisibleImages();
    },
});


module.exports = ScrollViewComponent;