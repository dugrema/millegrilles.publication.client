import React from 'react'

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

  onChange(content) {
    console.log('onChange', content)
  }

  render() {
    if(this.state.SummernoteDeps) {
      const SummernoteDeps = this.state.SummernoteDeps
      return (
        <SummernoteDeps />
      )
    }

    return 'Pas charge'
  }
}
