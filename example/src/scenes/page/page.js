import React, { PureComponent, PropTypes } from 'react';
import { Match } from 'react-router';
import load, { Status } from 'tectonic';
import ui from 'redux-ui';
import css from 'react-css-modules';
import Page from '../../models/page';
// Components
import Loading from '../../components/loading/loading.js';
import PageHeader from './header.js';
import Timeline from './timeline/timeline.js';
import ScanWrapper from './scan/wrapper.js';
import PageSettings from './settings/settings.js';
import styles from './page.css';


@ui({
  state: {
    isAddTagVisible: false,
    // scanId is used to record the current scan so that we can hide the add
    // tag form when changing scans.
    scanId: null,
  },
})
@load(props => ({
  page: Page.getItem({ id: props.params.pageId }),
}))
@css(styles)
export default class PageComponent extends PureComponent {
  static propTypes = {
    pathname: PropTypes.string,
    params: PropTypes.shape({
      pageId: PropTypes.string,
    }),
    page: React.PropTypes.instanceOf(Page),
    status: PropTypes.shape({
      page: PropTypes.instanceOf(Status),
    }),
  }

  scanComponent = ({ params }) => (
    <ScanWrapper
      page={ this.props.page }
      pageId={ this.props.params.pageId }
      scanId={ params.scanId || this.props.page.lastScan.id }
    />
  );

  pageSettings = () => (
    <PageSettings
      initialValues={ this.props.page.values() }
      page={ this.props.page }
    />
  );

  render() {
    const {
      page,
      status,
      pathname,
    } = this.props;

    if (status.page.isPending()) {
      return <Loading />;
    }

    return (
      <div styleName='wrapper'>
        <div styleName='page'>
          <PageHeader
            page={ page }
          />
          <Match exactly pattern={pathname} component={ this.scanComponent } />
          <Match pattern={`${pathname}/scans/:scanId`} component={ this.scanComponent } />
          <Match pattern={`${pathname}/settings`} component={ this.pageSettings } />
        </div>
        <Timeline page={ page } />
      </div>
    );
  }
}
