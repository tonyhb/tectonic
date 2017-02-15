import React, { PureComponent, PropTypes } from 'react';
import load, { Status } from 'tectonic';
import Page from '../../models/page.js';
import SiteModel from '../../models/site.js';
import Header, { LeftHeader } from '../../components/header';
import Content from '../../components/content/content.js';
import Loading from '../../components/loading/loading.js';
import PagePreview from './pagePreview.js';

@load((props) => ({
  site: SiteModel.getItem({ domain: props.params.domain }),
  pages: Page.getList({ domain: props.params.domain }),
}))
export default class Site extends PureComponent {
  static propTypes = {
    site: PropTypes.instanceOf(SiteModel),
    pages: PropTypes.arrayOf(PropTypes.instanceOf(Page)),
    status: PropTypes.shape({
      site: PropTypes.instanceOf(Status),
      pages: PropTypes.instanceOf(Status),
    }),
  }

  render() {
    const {
      site,
      pages,
    } = this.props;

    if (this.props.status.site.isPending() || this.props.status.pages.isPending()) {
      return <Loading />;
    }

    return (
      <div>
        <Header>
          <LeftHeader>
            <h1>{ site.domain }</h1>
          </LeftHeader>
        </Header>
        <Content>
          <h4>You're monitoring { pages.length } pages from this site</h4>
          <div>
            { pages.map(p => <PagePreview page={ p } />) }
          </div>
        </Content>
      </div>
    );
  }
}
