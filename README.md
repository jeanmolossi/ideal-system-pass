# Browser Extension Starter

## Development

Install dependencies:

```sh
npm install
```

Build the extension:

```sh
npm run build
```

Watch for changes during development:

```sh
npm run watch
```

## Password Generation

Use the `generatePassword` utility to create random passwords. Three presets are available via the `complexity` option:

- `simple`: lowercase letters only.
- `medium`: adds uppercase and numbers.
- `strong`: includes symbols as well.

```ts
import { generatePassword } from './src/utils/passwordGenerator';
const password = generatePassword({ length: 16, complexity: 'strong' });
```

## Import / Export

Credentials can be imported from CSV or JSON files and exported in encrypted form.

### CSV format

Each line must contain `id,credential`:

```
example.com,mySecret
```

### JSON format

An array of objects:

```json
[
  { "id": "example.com", "credential": "mySecret" }
]
```

### Export format

Exported data is a JSON string containing encrypted entries as stored internally.

## Usage Steps

1. Prepare your CSV or JSON file in the formats above.
2. Call `importFromCSV` or `importFromJSON` with your master password and file contents.
3. Use `exportEncrypted` to produce an encrypted backup of all stored credentials.

## Future Synchronization

Current storage is local only. The exported format is suitable for adding optional synchronisation with external APIs or WebDAV in the future.

## Installation

1. Run `npm run build` to generate the `dist` folder.
2. Open `chrome://extensions` in your browser and enable *Developer mode*.
3. Choose **Load unpacked** and select the generated `dist` directory.

## Contributing

Pull requests and issues are welcome. Please run `npm run build` before submitting changes.
