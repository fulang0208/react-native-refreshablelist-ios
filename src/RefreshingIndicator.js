'use strict'

import React, {Component, PropTypes, createElement, isValidElement} from 'react';
import ReactNative, {
  View,
  Text,
  ActivityIndicatorIOS,
  ProgressBarAndroid,
  StyleSheet,
  Platform,
} from 'react-native';
// '↑↓'
export default class RefreshingIndicator extends Component {

  static propTypes = {
    promptStyle: PropTypes.object,
    indicatorStyle: PropTypes.object,
    pullingIndicator: PropTypes.oneOfType([PropTypes.func, PropTypes.element]),
    holdingIndicator: PropTypes.oneOfType([PropTypes.func, PropTypes.element]),
    refreshingIndicator: PropTypes.oneOfType([PropTypes.func, PropTypes.element]),
    pullingPrompt: PropTypes.string,
    holdingPrompt: PropTypes.string,
    refreshingPrompt: PropTypes.string,
    isRefreshing: PropTypes.bool,
    isWaitingForRelease: PropTypes.bool,
    isNoMore: PropTypes.bool,
    noMorePromt: PropTypes.string,
    noMoreIndicator: PropTypes.oneOfType([PropTypes.func, PropTypes.element]),
  };

  static defaultProps = {
    pullingIndicator: <Text>↑</Text>,
    holdingIndicator: <Text>↓</Text>,
    refreshingIndicator: Platform.OS === 'ios' ? ActivityIndicatorIOS : ProgressBarAndroid,
    pullingPrompt: '上拉刷新',
    holdingPrompt: '松手刷新',
    refreshingPrompt: '正在刷新',
    promptStyle: {marginLeft:12},
    isRefreshing: false,
    isWaitingForRelease: false,
    isNoMore: false,
    noMorePromt: '没有更多了～'
  };

  constructor(props:any) {
    super(props);
  }

  renderPrompt() {
    var prompt = '';

    // console.log("isRefreshing:", this.props.isRefreshing);
    // console.log("isWaitingForRelease:", this.props.isWaitingForRelease);

    if (this.props.isNoMore) {
      prompt = this.props.noMorePromt;
    }else if (this.props.isWaitingForRelease) {
      prompt = this.props.holdingPrompt;
    }else if (this.props.isRefreshing) {
      prompt = this.props.refreshingPrompt;
    }else {
      prompt = this.props.pullingPrompt;
    }
    return (
      <Text style={[this.props.promptStyle, styles.prompt]}>{prompt}</Text>
    );
  }

  renderIndicator() {
    var activityIndicator;
    if (this.props.isNoMore) {
      activityIndicator = this.props.noMoreIndicator;
    }else if (this.props.isWaitingForRelease) {
      activityIndicator = this.props.holdingIndicator;
    }else if (this.props.isRefreshing) {
      activityIndicator = this.props.refreshingIndicator;
    }else {
      activityIndicator = this.props.pullingIndicator;
    }
    if (activityIndicator) {
      if (isValidElement(activityIndicator)) return activityIndicator;
      return createElement(activityIndicator, {style:this.props.indicatorStyle});
    }
    return null;
  }

  render() {
    return (
      <View style={[styles.container, this.props.style]}>
        {this.renderIndicator()}
        {this.renderPrompt()}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  prompt: {
    backgroundColor: '#ffffff00',
  }
});
