import React from 'react';
import { Link } from 'react-router';
import Page from '../../models/page';

const DashboardPage = ({ page }) => (
  <Link to={ `/sites/${page.site.domain}/pages/${page.id}` }>
    <img alt='scan' src={ page.lastScan.imageUrl() } width="250" />
    <p>{ page.name }</p>
  </Link>
);

DashboardPage.propTypes = {
  page: React.PropTypes.instanceOf(Page),
};

export default DashboardPage;
