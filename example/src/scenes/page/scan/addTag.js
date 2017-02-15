import React, { Component } from 'react';
import ui from 'redux-ui';
import css from 'react-css-modules';
import styles from './addTag.css';

@ui()
@css(styles)
export default class AddTag extends Component {

  static propTypes = {
    // UI inherited from page.js, so that clicking a scan resets
    // the UI.
    ui: React.PropTypes.shape({ isAddTagVisible: React.PropTypes.bool }),
    updateUI: React.PropTypes.func,
  }

  showForm = (evt) => {
    evt.preventDefault();
    this.props.updateUI({ isAddTagVisible: true });
  }

  render() {
    const { isAddTagVisible } = this.props.ui;

    if (!isAddTagVisible) {
      return <button styleName='addTag' onClick={ this.showForm }>+</button>;
    }

    return (
      <div styleName='wrapper'>
        <input type='text' styleName='tagName' />
      </div>
    );
  }
}
