import React, { Component, PropTypes } from 'react';
import { Link } from 'react-router';
import ui from 'redux-ui';
import css from 'react-css-modules';
import load from 'tectonic';
// components
import ScanOverlay from './scanOverlay.js';
import InvalidScan from './invalidScan.js';
import Tag from '../../../components/tag/tag.js';
// models
import Page from '../../../models/page.js';
import Scan from '../../../models/scan.js';
// misc
import styles from './scan.css';

/**
 * This is the visual component for each scan in a timeline
 */
@load()
@ui({
  state: {
    isModalVisible: false,
  },
})
@css(styles, { allowMultiple: true })
class ScanLink extends Component {
  static propTypes = {
    scan: PropTypes.instanceOf(Scan),
    isActive: PropTypes.bool,
    onClick: PropTypes.func,
    href: PropTypes.string,

    ui: PropTypes.shape({
      isModalVisible: PropTypes.bool,
    }),
    updateUI: PropTypes.func,

    // Tectonic:
    query: PropTypes.func,
  }

  onShowTrash = (evt) => {
    evt.preventDefault();
    this.props.updateUI('isModalVisible', true);
  }

  /**
   * Mark a scan as invalid by updating the API endpoint
   */
  onInvalidate = (evt) => {
    evt.preventDefault();
    evt.stopPropagation();

    const opts = this.props.scan.updateOpts({ isValid: false });
    this.props.query(opts, () => {
      // TODO: notifications
    });
  }

  onTrash = () => {
    this.props.query(this.props.scan.deleteOpts(), () => {
    });
  }

  getModal() {
    const { isModalVisible } = this.props.ui;
    if (isModalVisible) {
      return (
        <ScanOverlay
          header='Permanently delete this scan?'
          submitText='Delete'
          onSubmit={ this.onTrash }
          onCancel={ this.hideModal }
        />
      );
    }
    return null;
  }

  hideModal = (evt) => {
    evt.preventDefault();
    this.props.updateUI('isModalVisible', false);
  }

  render() {
    const { href, isActive, onClick, scan } = this.props;

    return (
      <a
        styleName={ isActive ? 'scan selected' : 'scan' }
        href={ href }
        onClick={ onClick }
      >
        { this.getModal() }
        <div>
          <p styleName='date'>{ scan.humanDate() }</p>
          <p styleName='title'>{ scan.getTitle() }</p>
          { scan.tags.map(t => <Tag tag={ t } key={ t } />) }
        </div>
        <div styleName='actions'>
          <button onClick={ this.onInvalidate } styleName='invalidate'>Invalidate</button>
          <button onClick={ this.onShowTrash } styleName='trash'>Trash</button>
        </div>
      </a>
    );
  }
}

/**
 * This renders a link to the actual scan, containing the ScanLink visual
 * component
 */
const ScanComponent = ({ page, scan }) => (
  <Link to={ `/sites/${page.site.domain}/pages/${page.id}/scans/${scan.id}` }>
    {
      (props) => {
        if (scan.isValid) {
          return <ScanLink { ...props } scan={ scan } />;
        }
        return <InvalidScan scan={ scan } />;
      }
    }
  </Link>
);

ScanComponent.propTypes = {
  page: React.PropTypes.instanceOf(Page),
  scan: React.PropTypes.instanceOf(Scan),
};

export default ScanComponent;
