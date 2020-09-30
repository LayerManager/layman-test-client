import {Form, Button} from 'semantic-ui-react'
import htmlCleaner from "clean-html";

const get_file_content = async (file) => {
  const fr = new FileReader();
  return new Promise((resolve, reject) => {
    fr.onload = (evt) => {
      resolve(evt.target.result);
    };
    fr.onerror = reject;
    fr.readAsText(file);
  });
}



class WfsPostTransactionParams extends React.PureComponent {

  fileInputRef = React.createRef();

  fileChange = async e => {
      const file = e.target.files[0];
      const file_content = await get_file_content(file);
      this.props.handleDataChange(file_content);
  };

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
              rows={15}
              value={this.props.data}
              onChange={(event) => {this.props.handleDataChange(event.target.value)}}/>
          <Button
              content="Import XML from file"
              onClick={() => this.fileInputRef.current.click()}/>
          <input inline
              ref={this.fileInputRef}
              hidden
              name="xml"
              type="file"
              onChange={this.fileChange}/>
          <Button content="Insert sample XML (layername=populated_places)" onClick={(event) => {this.props.handleDataChange(sampleXML)}}/>
          <br/>
          <br/>
        </div>
    );
  }
}

export default WfsPostTransactionParams;

