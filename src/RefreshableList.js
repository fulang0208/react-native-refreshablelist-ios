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
} from 'react-native';

import RefreshingIndicator from './RefreshingIndicator'

const delay = () => new Promise((resolve) => InteractionManager.runAfterInteractions(resolve));

export default class RefreshableList extends Component {

  state:{
    dataSource: ListView.DataSource,
    isNoMore: boolean,
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

  refreshHeader:View;
  refreshFooter:View;
  listView:ListView;

  listHeight:number;
  isTouch:boolean;
  isLoadMore:boolean;
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
      isNoMore:false,
    };
  }

  componentDidMount() {
    this.handleRefresh();
  }

  renderRow(rowData:string) {
    return (
      <View style={{height:80, backgroundColor:'#e9e9e9'}}>
        <Text style={{flex:1}}>{rowData}</Text>
      </View>
    );
  }
  _onScroll = (e:Object)=>{
    let offsetY = e.nativeEvent.contentOffset.y;
    if (offsetY > 0) {
      this.handlePullUp(e.nativeEvent);
    }else {
      this.handlePullDown(e.nativeEvent);
    }
    if (this.state.isNoMore && this.isTouch) {
      let positionY = (this.listHeight+offsetY-e.nativeEvent.contentSize.height);
      this.refreshFooter.setNativeProps({style:{bottom:positionY-this.props.refreshFooterHeight}});
    }
    this.props.onScroll && this.props.onScroll(arguments);
  };

  handlePullDown(nativeEvent:Object) {
    let offsetY = nativeEvent.contentOffset.y;
    let positionY = this.props.refreshHeaderHeight + offsetY;
    if (this.isTouch) {
      if (positionY <= 0) {
        this.refreshHeader.setNativeProps({style:{top:-positionY}})
      }
    }else if (offsetY != 44) {
      this.refreshHeader.setNativeProps({style:{top:-offsetY}})
    }
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
    let positionY = (this.listHeight+offsetY-contentSizeHeight);
    if (positionY > 0) {
      if (this.isTouch) {
        this.refreshFooter.setNativeProps({style:{bottom:positionY-this.props.refreshFooterHeight}});
      }else if (positionY != this.props.refreshFooterHeight) {
        this.refreshFooter.setNativeProps({style:{bottom:positionY-this.props.refreshFooterHeight}});
      }
    }
    if (positionY > this.props.refreshFooterHeight+10 && !this.state.isNoMore) {
      if (!this.state.pullUpWaitingForRelease && !this.state.isRefreshing) {
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
      this.listView.setNativeProps({style:{marginTop:this.props.refreshHeaderHeight},contentOffset:{x:0,y:-this.props.refreshHeaderHeight}});
      this.handleRefresh(()=>{
        LayoutAnimation.spring();
        this.listView.setNativeProps({style:{marginTop:0}, contentOffset:{x:0,y:0}});
      });
    }

    if (this.state.pullUpWaitingForRelease) {
      this.setState({pullUpWaitingForRelease:false});
      let contentOffset = this.lastContentHeight - this.listHeight + this.props.refreshFooterHeight;
      this.listView.setNativeProps({style:{marginBottom:this.props.refreshFooterHeight}});
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
    this.setState({isRefreshing:true});
    new Promise((resolve, reject)=>{
      this.props.loadmore(resolve, reject);
    })
    .then((data)=>{

      let contentOffset = this.lastContentHeight - this.listHeight + this.props.refreshFooterHeight;
      if (Array.isArray(data) && data.length > 0) {
        this.datas = this.datas.concat(data);
        this.setState({dataSource:this.state.dataSource.cloneWithRows(this.datas)});
        this.listView.setNativeProps({style:{marginBottom:0}});
        this.refreshFooter.setNativeProps({style:{bottom:-this.props.refreshFooterHeight}});
      }else {
        this.listView.setNativeProps({style:{marginBottom:0}, contentOffset:{x:0,y:contentOffset}});
        this.refreshFooter.setNativeProps({style:{bottom:0}});
        this.setState({isNoMore:true});
      }
      this.setState({isRefreshing:false});
    })
    .catch((err)=>{
      console.log('load more get a err:',err);
      this.setState({isRefreshing:false});
    });
  }

  _onResponderGrant = ()=>{
    this.isTouch = true;
    this.props.onResponderGrant && this.props.onResponderGrant(arguments);
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
    if (this.props.loadmore) {
      if (this.props.refreshFooterComponent) {
        if (isValidElement(this.props.refreshFooterComponent)) return this.props.refreshFooterComponent;
        return createElement(this.props.refreshFooterComponent,
          {
            isNoMore:this.state.isNoMore,
            isWaitingForRelease:this.state.pullUpWaitingForRelease,
            isRefreshing:this.state.isRefreshing,
            style: this.props.refreshFooterStyle
          }
        );
      }else {
        return (
          <RefreshingIndicator
            style={this.props.refreshFooterStyle}
            isNoMore={this.state.isNoMore}
            isWaitingForRelease={this.state.pullUpWaitingForRelease}
            isRefreshing={this.state.isRefreshing}/>
        );
      }
    }else {
      return null;
    }
  }

  render() {
    return (
      <View style={[styles.container, this.props.style]}>
        <View style={[styles.prompt, {height:this.props.refreshHeaderHeight, top:0}]} ref={(ref)=>this.refreshHeader=ref}>
          {this.renderrefreshHeader()}
        </View>
        <ListView
          {...this.props}
          ref={(ref)=>this.listView=ref}
          onLayout={this._onLayout}
          style={styles.list}
          dataSource={this.state.dataSource}
          renderRow={this.renderRow}
          onScroll={this._onScroll}
          scrollEventThrottle={32}
          decelerationRate={0.8}
          onResponderGrant={this._onResponderGrant}
          onResponderRelease={this._onResponderRelease}
          />
        <View style={[styles.prompt, {height:this.props.refreshFooterHeight, bottom:-this.props.refreshFooterHeight}]} ref={(ref)=>this.refreshFooter=ref}>
          {this.renderRefreshFooter()}
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container:{
    flex:1,
  },
  list:{
    marginBottom:0,
  },
  prompt:{
    position:'absolute',
    left:0,
    right:0,
    overflow:'hidden',
  }
});
