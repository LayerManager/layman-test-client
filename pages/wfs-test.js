import HeaderMenu from "../components/HeaderMenu";
import {List, Container, Form, Header, Ref, Tab} from "semantic-ui-react";
import fetch from 'unfetch';

const containerStyle = {
  position: 'absolute',
  top: '40px',
  padding: '1em',
};

class WfsTestPage extends React.PureComponent {
    componentDidMount() {
        console.log('componentDidMount');
        fetch("http://localhost:3000/client/geoserver/test/wfs?request=Transaction", {
  method: "POST",
  body: `<?xml version="1.0"?>
<wfs:Transaction
   version="2.0.0"
   service="WFS"
   xmlns:test="http://test"
   xmlns:fes="http://www.opengis.net/fes/2.0"
   xmlns:gml="http://www.opengis.net/gml/3.2"
   xmlns:wfs="http://www.opengis.net/wfs/2.0"
   xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
   xsi:schemaLocation="http://www.opengis.net/wfs/2.0
                       http://schemas.opengis.net/wfs/2.0/wfs.xsd
                       http://www.opengis.net/gml/3.2
                       http://schemas.opengis.net/gml/3.2.1/gml.xsd">
   <wfs:Insert>
       <test:populated_places>
           <test:wkb_geometry>
               <gml:MultiCurve srsName="urn:ogc:def:crs:EPSG::3857" srsDimension="2">
                   <gml:curveMember>
                       <gml:LineString>
                           <gml:posList>3722077.1689 5775850.1007 3751406.9331 5815606.0102 3830548.3984 5781176.5357
                               3866350.4899 5774848.8358 3880796.9478 5743277.797 3897591.3679 5738418.6547
                           </gml:posList>
                       </gml:LineString>
                   </gml:curveMember>
               </gml:MultiCurve>
           </test:wkb_geometry>
       </test:populated_places>
   </wfs:Insert>
</wfs:Transaction>`,
  headers: {
    "Content-Type": "text/xml",
    "Accept": "text/xml"}}).then((r) => {
              console.log(r.status, r.ok);
              return r.text();
            }).then( async (text) => {
                console.log(text)
            });
    }
    render() {
        const {user, num_authn_providers} = this.props;
        return (
            <div>
                <HeaderMenu user={user} show_log={!!num_authn_providers}/>

                <Container style={containerStyle}>
                    <Header as='h1'>Client-side user information</Header>
                    <List bulleted>
                        {Object.keys(user).map(key => (
                            <List.Item key={key}>{key}: {user[key].toString()}</List.Item>
                        ))}
                    </List>
                </Container>
            </div>
        );
    }
}

export default WfsTestPage;
