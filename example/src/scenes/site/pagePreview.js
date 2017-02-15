import React, { PropTypes } from 'react';
import { Link } from 'react-router';
import css from 'react-css-modules';
import Page from '../../models/page.js';
import Hex from '../../components/hex/hex.js';
import styles from './pagePreview.css';

const PagePreview = ({ page }) => (
  <div styleName='preview'>
    <Link to={ `/sites/${page.site.domain}/pages/${page.id}` }>
      <div styleName='image'>
        <img src={ page.lastScan.imageUrl() } alt='scan' />
      </div>
      <p styleName='text'>
        <Hex>5</Hex>
        { page.title() }
      </p>
    </Link>
  </div>
);

PagePreview.propTypes = {
  page: PropTypes.instanceOf(Page),
};

export default css(styles)(PagePreview);
