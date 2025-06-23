// filepath: backend/src/print.ts
import printer from 'printer';

export function printFile(filePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    printer.printFile({
      filename: filePath,
      success: () => resolve(),
      error: (err) => reject(err),
    });
  });
}