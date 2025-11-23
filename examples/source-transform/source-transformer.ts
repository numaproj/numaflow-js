import { sourceTransform } from '../../index'

async function sourceTransformFn(datum: sourceTransform.SourceTransformDatum) {
  return [new sourceTransform.SourceTransformMessage(datum.value, datum.eventtime).withKeys(datum.keys).withTags([])]
}

async function main() {
  const sinker = new sourceTransform.SourceTransformAsyncServer(sourceTransformFn)

  const shutdown = () => {
    sinker.stop()
  }
  process.on('SIGTERM', shutdown)
  process.on('SIGINT', shutdown)

  console.log('Starting source transformer server')
  await sinker.start()
}

main().catch(console.error)
