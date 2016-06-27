/**
 * Sample react-native-refreshablelist-ios
 * https://github.com/fulang0208/react-native-refreshablelist-ios.git
 * @flow
 */

 import React, { Component } from 'react';
 import {
   AppRegistry,
   StyleSheet,
   Text,
   View
 } from 'react-native';

 import {RefreshableList} from 'react-native-refreshablelist-ios';

 const datas = [['aaa','bbb', 'ccc'],['aaa','bbb'],[]];
 var times = 0;

 class Example extends Component {
   render() {
     return (
 			<RefreshableList
         style={styles.list}
         loadData={this.loadData}
         loadmore={this.loadmore}/>
 		);
   }

   loadData(resolve:Function, reject:Function) {
     function timeout () {
       times = 0;
       resolve(["111","222","333","444","555","666","777"]);
     }
     setTimeout(timeout, 2000);
   }

   loadmore(resolve:Function, reject:Function) {
     function timeout () {
       resolve(datas[times]);
       times++;
     }
     setTimeout(timeout, 2000);
   }
 }

 const styles = StyleSheet.create({
   container: {
     flex: 1,
     justifyContent: 'center',
     alignItems: 'center',
     backgroundColor: '#F5FCFF',
   },
   list: {
     marginTop: 64,
   },
   instructions: {
     textAlign: 'center',
     color: '#333333',
     marginBottom: 5,
   },
 });
AppRegistry.registerComponent('Example', () => Example);
