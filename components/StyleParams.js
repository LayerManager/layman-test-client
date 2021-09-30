import assert from 'assert';
import {Form, Message, Loader, Table} from 'semantic-ui-react'
import AutoWidthInput from "./AutoWidthInput";
import fetch from "unfetch";

const NO_STYLE_CHOSEN = 'no_style_chosen';
const STYLE_CHOSEN_AND_PENDING = 'style_chosen_and_pending';
const STYLE_CHOSEN_AND_ERROR = 'style_chosen_and_error';
const STYLE_CHOSEN_AND_LOADED = 'style_chosen_and_loaded';
const STYLE_STATES = [
    NO_STYLE_CHOSEN,
    STYLE_CHOSEN_AND_PENDING,
    STYLE_CHOSEN_AND_ERROR,
    STYLE_CHOSEN_AND_LOADED,
]

class StyleParams extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      style: NO_STYLE_CHOSEN,
    };
    this.handleStyleFileSelected = this.handleStyleFileSelected.bind(this);
  }

  async handleStyleFileSelected(event) {
    let file = event.target.files[0];
    if (file) {
      this.setState({style: STYLE_CHOSEN_AND_PENDING});
      const form_data = new FormData();
      form_data.append('style', file);
      const fetch_opts = {
        method: 'POST',
        body: form_data,
      };
      const response = await fetch(`${this.props.url_prefix}/rest/tools/style-info`, fetch_opts);
      if (response.ok) {
        const resp_json = await response.json();
        this.setState({
          style: STYLE_CHOSEN_AND_LOADED,
          external_files: resp_json['external_files'] || [],
        });
      } else {
        const resp_text = await response.text();
        this.setState({
          style: STYLE_CHOSEN_AND_ERROR,
          style_http_code: response.status,
          style_text: resp_text,
        });
      }
    } else {
      this.setState({style: NO_STYLE_CHOSEN});
    }
  }

  render() {
    const style_state = this.state.style;
    assert(STYLE_STATES.includes(style_state));
    let style_ui = null;
    if (style_state === STYLE_CHOSEN_AND_ERROR) {
      style_ui = (<Message negative>
        <Message.Header>Error when parsing style file</Message.Header>
        <p>Status code: {this.state.style_http_code}</p>
        <code style={{whiteSpace: 'pre'}}>{this.state.style_text}</code>
      </Message>);
    } else if (style_state === STYLE_CHOSEN_AND_LOADED) {
      style_ui = <>
        <strong>External style images</strong>
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Path</Table.HeaderCell>
              <Table.HeaderCell>File</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {this.state.external_files.map((file_path, idx) => {
              return <Table.Row key={idx}>
                <Table.Cell>
                  <div style={{overflow: 'auto'}}>
                    <AutoWidthInput name={`style__path__${idx}`} defaultValue={file_path}
                                    style={{margin: 0}}/>
                  </div>
                </Table.Cell>
                <Table.Cell>
                    <input style={{minWidth: '20em'}} name={`style__file__${idx}`} type="file"
                           accept={`${file_path.substr(file_path.lastIndexOf('.'))}`}/>
                </Table.Cell>
              </Table.Row>
            })}
          </Table.Body>
        </Table>
      </>;
    }
    return (
        <>
          <Form.Field inline>
            <label>Style file</label>
            <input name="style" type="file" accept=".sld,.xml,.qml" onChange={this.handleStyleFileSelected}/>
            {style_state === STYLE_CHOSEN_AND_PENDING ? <> <Loader active inline/> Parsing style file</> : null}
          </Form.Field>
          {style_ui}
        </>
    );
  }
}

export default StyleParams;

