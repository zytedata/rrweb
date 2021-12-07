import { RRIframeElement, RRNode } from '../src/document-nodejs';
import {
  RRIframeElement as RRIframeElementBrowser,
  RRNode as RRNodeBrowser,
} from '../src/document-browser';

/**
 * Print the RRDom as a string.
 * @param rootNode the root node of the RRDom tree
 * @returns printed string
 */
export function printRRDom(rootNode: RRNode | RRNodeBrowser) {
  return walk(rootNode, '');
}

function walk(node: RRNode | RRNodeBrowser, blankSpace: string) {
  let printText = `${blankSpace}${node.toString()}\n`;
  for (const child of node.childNodes)
    printText += walk(child, blankSpace + '  ');
  if (node instanceof RRIframeElement || node instanceof RRIframeElementBrowser)
    printText += walk(node.contentDocument, blankSpace + '  ');
  return printText;
}
