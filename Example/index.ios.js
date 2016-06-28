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
       <View style={{flex:1}}>
         <View style={styles.header}>
           <Text style={styles.title}>Example</Text>
         </View>
         <RefreshableList
           style={styles.list}
           loadData={this.loadData}
           loadmore={this.loadmore}
           renderRow={this.renderRow}/>
      </View>
 		);
   }

   renderRow(rowData:string) {
     return (
       <View style={{height:80, backgroundColor:'#e9e9e9'}}>
         <Text style={{flex:1}}>{rowData}</Text>
       </View>
     );
   }

   loadData(resolve:Function, reject:Function) {
     function timeout () {
       times = 0;
       resolve(["111","222","333","444","555","666","777","111","222","333","444","555","666","777"]);
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
   header: {
     top: 20,
     left: 0,
     right: 0,
     position: 'absolute',
     height: 44,
     backgroundColor: 'white'
   },
   title: {
     justifyContent: 'center',
     alignSelf: 'center',
     fontSize: 17,
     marginTop: 12,
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
