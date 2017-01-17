# Polling and subscribing to endpoints

Currently, to subscribe to an endpoint we must long poll via the `load` prop,
though there is a roadmap to add a websocket driver plus internal polling logic
to the decorator (see [#35](https://github.com/tonyhb/tectonic/issues/35),
[#43](https://github.com/tonyhb/tectonic/issues/43)).

The easiest way to currently implement polling is via side effects to a
self-contained component:

```
@load()
class MyPoller extends React.Component {
  static propTypes = {
    load: React.PropTypes.func,
  }

  state = {
    interval: undefined
  }

  componentDidMount = () => {
    this.setState({
      interval: window.setInterval(this.loadData, 5000)
    });
  }

  componentWillUnmount() => {
    window.clearInterval(this.state.interval);
  }

  loadData = () => {
    this.props.load({
      user: UserModel.getItem({ id: this.props.userId }),
    });
  }

  render() {
    // ...
  }

}
```
