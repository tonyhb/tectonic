import React, { PureComponent, PropTypes } from 'react';
import load, { Status } from 'tectonic';
import Loading from '../../../components/loading/loading';
import ScanComponent from './scan';
import Scan from '../../../models/scan.js';

/**
 * ScanWrapper exists so that scan.js can render and mount with a fully loaded
 * Scan model, allowing us to use refs in componentDidMount immediately.
 */
@load(props => ({
  scan: Scan.getItem({ page: props.pageId, id: props.scanId }),
}))
export default class ScanWrapper extends PureComponent {
  static propTypes = {
    status: PropTypes.shape({
      scan: PropTypes.instanceOf(Status),
    }),
  }

  render() {
    if (this.props.status.scan.isPending()) {
      return <Loading />;
    }

    return <ScanComponent { ...this.props } />;
  }
}
