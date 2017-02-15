import React, { PureComponent } from 'react';
import { Link } from 'react-router';
import css from 'react-css-modules';
import Page from '../../models/page.js';
import styles from './header.css';

@css(styles)
export default class PageHeader extends PureComponent {
  static propTypes = {
    page: React.PropTypes.instanceOf(Page),
  }

  render() {
    const { page } = this.props;
    return (
      <div styleName='pageHeader'>
        <div styleName='pageInfo'>
          <h1>{ page.title() }</h1>
          <Link to={ `/sites/${page.site.domain}` }>Back to {page.site.domain}</Link>
        </div>

        <div styleName='actions'>
          <Link to={ `/sites/${page.site.domain}/pages/${page.id}` }>Scans</Link>
          <Link to={ `/sites/${page.site.domain}/pages/${page.id}/settings` }>Settings</Link>
          { /* <span /> */ }
        </div>
      </div>
    );
  }
}
