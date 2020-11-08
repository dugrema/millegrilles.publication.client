import React from 'react'

// Note : hack pour importer SummerNote avec dependance jQuery
//        Importer directement empeche le chargement correct de
//        window.jQuery = $ dans index.js

export default class EditeurSummernote extends React.Component {

  state = {
    SummernoteDeps: ''
  }

  async componentDidMount() {
    // Importer dependances summernotes ici pour eviter erreur chargement jQuery
    const importResult = await import('./SummernoteDeps')
    const SummernoteDeps = importResult.default
    this.setState({SummernoteDeps})
  }

  onChange = content => {
    const post_id = this.props.post_id,
          langue = this.props.langue

    this.props.onChange(post_id, langue, content)
  }

  render() {
    if(this.state.SummernoteDeps) {
      const SummernoteDeps = this.state.SummernoteDeps
      return (
        <SummernoteDeps onChange={this.onChange}
                        value={this.props.value} />
      )
    }

    return 'Pas charge'
  }
}
