import {Form, Button} from 'semantic-ui-react'

class WfsPostTransactionParams extends React.PureComponent {

  render() {
    const {user} = this.props;
    const sampleXML = `<?xml version="1.0"?>
<wfs:Transaction
   version="2.0.0"
   service="WFS"
   xmlns:username="http://${user}"
   xmlns:fes="http://www.opengis.net/fes/2.0"
   xmlns:gml="http://www.opengis.net/gml/3.2"
   xmlns:wfs="http://www.opengis.net/wfs/2.0"
   xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
   xsi:schemaLocation="http://www.opengis.net/wfs/2.0
                       http://schemas.opengis.net/wfs/2.0/wfs.xsd
                       http://www.opengis.net/gml/3.2
                       http://schemas.opengis.net/gml/3.2.1/gml.xsd">
   <wfs:Insert>
       <username:populated_places>
           <username:wkb_geometry>
               <gml:MultiCurve srsName="urn:ogc:def:crs:EPSG::3857" srsDimension="2">
                   <gml:curveMember>
                       <gml:LineString>
                           <gml:posList>3722077.1689 5775850.1007 3751406.9331 5815606.0102 3830548.3984 5781176.5357
                               3866350.4899 5774848.8358 3880796.9478 5743277.797 3897591.3679 5738418.6547
                           </gml:posList>
                       </gml:LineString>
                   </gml:curveMember>
               </gml:MultiCurve>
           </username:wkb_geometry>
       </username:populated_places>
   </wfs:Insert>
</wfs:Transaction>`
    return (
        <div>
          <Form.TextArea
              className="mandatory"
              name="data"
              label="XML Body"
              placeholder={sampleXML}
              value={this.props.data}
              onChange={(event) => {this.props.handleDataChange(event.target.value)}}/>
          <Button content="Import XML from file" />
          <Button content="Insert sample XML" onClick={(event) => {this.props.handleDataChange(sampleXML)}}/>
          <br/>
          <br/>
        </div>
    );
  }
}

export default WfsPostTransactionParams;

