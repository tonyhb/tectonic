import React, { PureComponent, PropTypes } from 'react';
import css from 'react-css-modules';
import load from 'tectonic';
import Page from '../../../models/page.js';
import Scan from '../../../models/scan.js';
// components
import ScanComponent from './scan.js';
import Month from './month.js';
import Loading from '../../../components/loading/loading.js';
// css
import styles from './timeline.css';

@load(props => ({
  scans: Scan.getList({ page: props.page.id }),
}))
@css(styles, { allowMultiple: true })
export default class Timeline extends PureComponent {
  static propTypes = {
    page: PropTypes.instanceOf(Page),
    scans: PropTypes.arrayOf(Page),
    status: PropTypes.shape({
      scans: PropTypes.string,
    }),
  }

  mapScans() {
    const { page, scans } = this.props;

    if (scans.length === 0) {
      // TODO: no scans
      return null;
    }

    let month;

    return scans.map((s) => {
      const currentMonth = s.createdAt.getFullYear() + s.createdAt.getMonth();
      if (month !== currentMonth) {
        month = currentMonth;
        return (
          <div key={ s.id }>
            <Month month={ s.monthYear() } />
            <ScanComponent scan={ s } page={ page } />
          </div>
        );
      }

      return (
        <ScanComponent
          key={ s.id }
          scan={ s }
          page={ page }
        />
      );
    });
  }

  render() {
    const { scans, status } = this.props;

    if (status.scans.isPending()) {
      return (
        <div styleName='timeline'>
          <div styleName='container loading'>
            <Loading />
          </div>
        </div>
      );
    }

    return (
      <div styleName='timeline'>
        <div styleName='container'>
          <a href='#top' styleName='backToTop'>Back to top</a>
          <h2>Timeline</h2>
          <p styleName='updates'>{ scans.length } updates</p>

          <div styleName='nextScan'>
            <span>Next scan in:</span>
            <p>Now scanning</p>
          </div>

          <div styleName='scans'>
            { this.mapScans() }
          </div>
        </div>
      </div>
    );
  }
}
