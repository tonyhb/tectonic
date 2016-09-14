### Deleting a model

```js
@load({
  user: User.getItem({id: 1})
})
class Profile extends Component {
  static propTypes = {
    user: User.instanceOf
  }

  deleteUser() {
	// TODO: below
    // If you have a loaded model instance you can call `delete` on the model
    // and pass in extra props to satisfy driver needs
    this.props.user.delete({ account: 'foo' }, () => {})

    // Alternatively, the `@load()` decorator injects a `deleteModel` function
    // into the component which can take a model class and an object of
    // parameters to delete
    this.props.deleteModel(User, { id: 1 }, () => {})
  }

  render() {
    return (
      <div>
        <a href='#delete' onClick={ ::this.deleteUser }>Delete</a>
      </div>
    )
  }
}
```
