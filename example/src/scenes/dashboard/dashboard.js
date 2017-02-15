import React, { PureComponent, PropTypes } from 'react';
import css from 'react-css-modules';
import load from 'tectonic';

import Page from '../../models/page';
import styles from './dashboard.css';
import BlankSlate from './blankSlate.js';
import DashboardPage from './dashboardPage.js';
import Loading from '../../components/loading/loading.js';

@load({
  pages: Page.getList(),
})
@css(styles)
class Dashboard extends PureComponent {
  static propTypes = {
    pages: PropTypes.arrayOf(PropTypes.instanceOf(Page)),
    status: PropTypes.shape({
      pages: PropTypes.string,
    }),
  }

  render() {
    if (this.props.status.pages === 'PENDING') {
      return <Loading />;
    }

    if (this.props.status.pages === 'ERROR') {
      // TODO: generic error component
      return <p>Error</p>;
    }

    if (this.props.pages.length === 0) {
      return <BlankSlate />;
    }

    return (
      <div>
        { this.props.pages.map(page => <DashboardPage page={ page } key={ page.id } />) }
      </div>
    );
  }
}

export default Dashboard;
