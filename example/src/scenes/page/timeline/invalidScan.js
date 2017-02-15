import React, { Component, PropTypes } from 'react';
import css from 'react-css-modules';
import load from 'tectonic';
import styles from './scan.css';
import Scan from '../../../models/scan.js';

@load()
@css(styles)
export default class InvalidScan extends Component {
  static propTypes = {
    scan: PropTypes.instanceOf(Scan),
    query: PropTypes.func,
  }

  onRevalidate = (evt) => {
    evt.preventDefault();
    evt.stopPropagation();

    const opts = this.props.scan.updateOpts({ isValid: true });
    this.props.query(opts, () => {
      // TODO: notifications
    });
  }

  render() {
    const { scan } = this.props;

    return (
      <div styleName='invalid'>
        <div styleName='actions'>
          <button onClick={ this.onRevalidate } styleName='revalidate'>Revalidate</button>
        </div>
        <p><b>Invalidated</b> - { scan.humanDate() }</p>
      </div>
    );
  }

}
