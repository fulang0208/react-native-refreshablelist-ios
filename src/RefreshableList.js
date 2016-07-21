/*@flow*/
'use strict'

import React, {Component, PropTypes, createElement, isValidElement} from 'react';
import ReactNative, {
  ListView,
  View,
  Text,
  StyleSheet,
  InteractionManager,
  LayoutAnimation,
  ScrollView
} from 'react-native';

import RefreshingIndicator from './RefreshingIndicator'

const delay = () => new Promise((resolve) => InteractionManager.runAfterInteractions(resolve));

export default class RefreshableList extends Component {

  state:{
    dataSource: ListView.DataSource,
    pullUpWaitingForRelease: boolean,
    pullDownWaitingForRelease: boolean,
    isRefreshing: boolean,
    isLoadMore: boolean,
    isNoMore: boolean,
    refreshHeaderOpacity: number,
    refreshFooterOpacity: number,
  };

  static propTypes = {
    loadData: PropTypes.func.isRequired,
    refreshHeaderHeight: PropTypes.number,
    refreshHeaderComponent: PropTypes.oneOfType([PropTypes.func, PropTypes.element]),
    refreshHeaderStyle: PropTypes.object,
    loadmore: PropTypes.func,
    refreshFooterHeight: PropTypes.number,
    refreshFooterComponent: PropTypes.oneOfType([PropTypes.func, PropTypes.element]),
    refreshFooterStyle: PropTypes.object,
  };
  static defaultProps = {
    refreshHeaderHeight: 44,
    refreshFooterHeight: 44,
  };

  listView:ListView;
  listHeight:number;
  isTouch:boolean;
  datas:any;

  lastContentHeight:number;

  constructor(props:any) {
    super(props);
    this.state = {
      dataSource:new ListView.DataSource({
        rowHasChanged: (r1, r2) => r1 !== r2,
      }),
      pullUpWaitingForRelease: false,
      pullDownWaitingForRelease: false,
      isRefreshing: false,
      isLoadMore: false,
      isNoMore:false,
      refreshHeaderOpacity: 0,
      refreshFooterOpacity: 0
    };
  }

  componentDidMount() {
    this.handleRefresh();
  }

  _onScroll = (e:Object)=>{
    let offsetY = e.nativeEvent.contentOffset.y;
    this.lastOffSetY = offsetY;
    if (offsetY > 0) {
      this.handlePullUp(e.nativeEvent);
    }else {
      this.handlePullDown(e.nativeEvent);
    }
    this.props.onScroll && this.props.onScroll(arguments);
  };

  lastOffSetY:number;
  handlePullDown(nativeEvent:Object) {
    let offsetY = nativeEvent.contentOffset.y;
    let positionY = this.props.refreshHeaderHeight + offsetY;
    if (positionY < -10) {
      if (!this.state.isRefreshing && !this.state.pullDownWaitingForRelease) {
        this.setState({pullDownWaitingForRelease:true});
      }
    }else if (this.isTouch && this.state.pullDownWaitingForRelease) {
      this.setState({pullDownWaitingForRelease:false});
    }
  }

  handlePullUp(nativeEvent:Object) {
    let offsetY = nativeEvent.contentOffset.y;
    let contentSizeHeight = nativeEvent.contentSize.height;
    this.lastContentHeight = contentSizeHeight;
    if (this.props.loadmore === undefined || contentSizeHeight < this.listHeight) {
      this.props.onScroll && this.props.onScroll(arguments);
      return;
    }
    this.setState({refreshFooterOpacity:1});
    let positionY = (this.listHeight+offsetY-contentSizeHeight);
    if (positionY > this.props.refreshFooterHeight+10 && !this.state.isNoMore) {
      if (!this.state.pullUpWaitingForRelease && !this.state.isLoadMore) {
        this.setState({pullUpWaitingForRelease:true});
      }
    }else if (this.isTouch) {
      this.setState({pullUpWaitingForRelease:false});
    }
  }

  _onResponderRelease = ()=>{
    this.isTouch = false;
    if (this.state.pullDownWaitingForRelease) {
      this.setState({pullDownWaitingForRelease:false});
      this.listView.setNativeProps({style:{marginTop:0}, contentOffset:{x:0,y:this.lastOffSetY+this.props.refreshHeaderHeight}});
      this.handleRefresh(()=>{
        LayoutAnimation.spring();
        this.listView.setNativeProps({style:{marginTop:-this.props.refreshHeaderHeight}});
        this.setState({refreshFooterOpacity:0});
      });
    }

    if (this.state.pullUpWaitingForRelease) {
      this.setState({pullUpWaitingForRelease:false});
      this.listView.setNativeProps({style:{marginBottom:0}, contentOffset:{x:0,y:this.lastOffSetY}});
      let contentOffset = this.lastContentHeight - this.listHeight + this.props.refreshFooterHeight;
      this.handleLoadMore()
    }

    this.props.onResponderRelease && this.props.onResponderRelease(arguments);
  };

  handleRefresh(onComplete:Function) {
    this.setState({isRefreshing:true});
    var loadingPromise = new Promise((reslove, reject)=>{
      this.props.loadData(reslove, reject);
    });
    Promise.all([loadingPromise, delay()])
    .then((result)=>{
      let data = result[0];
      if (Array.isArray(data) && data.length > 0) {
        this.datas = data;
        if (this.state.isNoMore) {
          this.listView.setNativeProps({style:{marginBottom:-this.props.refreshFooterHeight}});
        }
        this.setState({dataSource:this.state.dataSource.cloneWithRows(this.datas), isNoMore:false});
      }
      this.setState({isRefreshing:false});
      onComplete && onComplete();
    })
    .catch((err)=>{
      console.log('load data get a err:',err);
      this.setState({isRefreshing:false});
      onComplete && onComplete();
    });
  }

  handleLoadMore() {
    this.setState({isLoadMore:true});
    new Promise((resolve, reject)=>{
      this.props.loadmore(resolve, reject);
    })
    .then((data)=>{

      let contentOffset = this.lastContentHeight - this.listHeight + this.props.refreshFooterHeight;
      if (Array.isArray(data) && data.length > 0) {
        this.datas = this.datas.concat(data);
        this.setState({dataSource:this.state.dataSource.cloneWithRows(this.datas)});
        this.listView.setNativeProps({style:{marginBottom:-this.props.refreshFooterHeight}});
      }else {
        this.setState({isNoMore:true});
      }
      this.setState({isLoadMore:false});
    })
    .catch((err)=>{
      console.log('load more get a err:',err);
      this.setState({isLoadMore:false});
    });
  }

  _onResponderGrant = ()=>{
    this.isTouch = true;
    this.props.onResponderGrant && this.props.onResponderGrant(arguments);
    this.setState({refreshHeaderOpacity:1});
  };

  _onLayout = (event)=>{
    if (!this.listHeight) {
      this.listHeight = event.nativeEvent.layout.height;
    }
    this.props.onLayout && this.props.layout(event);
  };

  renderrefreshHeader() {
    if (this.props.refreshHeaderComponent) {
      if (isValidElement(this.props.refreshHeaderComponent)) return this.props.refreshHeaderComponent;
      return createElement(this.props.refreshHeaderComponent,
        {
          isWaitingForRelease:this.state.pullDownWaitingForRelease,
          isRefreshing:this.state.isRefreshing,
          style: this.props.refreshFooterStyle
        }
      );
    }else {
      return (
        <RefreshingIndicator
          style={this.props.refreshFooterStyle}
          isWaitingForRelease={this.state.pullDownWaitingForRelease}
          isRefreshing={this.state.isRefreshing}
          pullingPrompt="下拉刷新"
          pullingIndicator={<Text>↓</Text>}
          holdingIndicator={<Text>↑</Text>}/>
      );
    }
  }

  renderRefreshFooter() {
    console.log("isLoadMore", this.state.isLoadMore);
    if (this.props.loadmore) {
      if (this.props.refreshFooterComponent) {
        if (isValidElement(this.props.refreshFooterComponent)) return this.props.refreshFooterComponent;
        return createElement(this.props.refreshFooterComponent,
          {
            isNoMore:this.state.isNoMore,
            isWaitingForRelease:this.state.pullUpWaitingForRelease,
            isRefreshing:this.state.isLoadMore,
            style: this.props.refreshFooterStyle
          }
        );
      }else {
        return (
          <RefreshingIndicator
            style={this.props.refreshFooterStyle}
            isNoMore={this.state.isNoMore}
            isWaitingForRelease={this.state.pullUpWaitingForRelease}
            isRefreshing={this.state.isLoadMore}/>
        );
      }
    }else {
      return null;
    }
  }
// contentContainerStyle={{marginTop:-this.props.refreshHeaderHeight}}
  render() {
    return (
      <View style={[styles.container, this.props.style]}
        removeClippedSubviews={true}>
        <ListView
          {...this.props}
          ref={(ref)=>this.listView=ref}
          onLayout={this._onLayout}
          style={[styles.list, {marginTop:-this.props.refreshHeaderHeight, marginBottom:-this.props.refreshFooterHeight}]}
          dataSource={this.state.dataSource}
          onScroll={this._onScroll}
          scrollEventThrottle={32}
          decelerationRate={0.8}

          renderHeader={
            ()=>(
                <View style={{height:this.props.refreshHeaderHeight, opacity:this.state.refreshHeaderOpacity}}>
                  {this.renderrefreshHeader()}
                </View>
            )
          }
          renderFooter={
            ()=>(
              <View style={{height:this.props.refreshFooterHeight, opacity:this.state.refreshFooterOpacity}}>
                {this.renderRefreshFooter()}
              </View>
            )
          }
          onResponderGrant={this._onResponderGrant}
          onResponderRelease={this._onResponderRelease}
          />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container:{
    flex:1,
    overflow:'hidden',
  },
  list:{
    marginBottom:0,
    overflow:'hidden',
  },
});
