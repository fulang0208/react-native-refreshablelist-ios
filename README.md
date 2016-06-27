# react-native-refreshablelist-ios
a pull down to refresh list view and pull up to load more for react native component

![](https://github.com/fulang0208/react-native-refreshablelist-ios/raw/master/Captures/example.gif)

### Installation

```npm install react-native-refreshablelist-ios --save```


### Usage

refer to the Example

#### Props
* `loadData` the function for refresh data.
* `refreshHeaderHeight` the height for refreshing indicator of header.
* `refreshHeaderComponent` the custom component for refreshing indicator of header.
* `refreshHeaderStyle` the custom style for refreshing indicator of header.
* `loadmore` the function for load more data.
* `refreshFooterHeight` the height for refreshing indicator of footer.
* `refreshFooterComponent` the custom component for refreshing indicator of footer.
* `refreshFooterStyle` the custom style for refreshing indicator of footer.

##### loadData
```js
loadData(resolve:Function, reject:Function) {
  if (loadDataSuccess)
    resolve(data);
  }else {
    reject(err);
  }
}
```

##### loadmore
```js
loadmore(resolve:Function, reject:Function) {
  if (loadMoreSuccess)
    resolve(additionalData);
  }else {
    reject(err);
  }
}
```

### License

MIT
