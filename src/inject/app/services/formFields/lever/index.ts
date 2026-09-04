import { TextInput } from './TextInput'
import { Textarea } from './Textarea'
import { RadioGroup } from './RadioGroup'
import { Dropdown } from './Dropdown'
import { Checkbox } from './Checkbox'
import { getElement } from '@src/shared/utils/getElements'

const inputs = [
  TextInput,
  Textarea,
  RadioGroup,
  Dropdown,
  Checkbox,
]

export const RegisterInputs = async (node: Node = document) => {
  const form = getElement(
    document,
    `.//form[@id="application-form" or contains(@class, "application-form")]`
  )
  if (form) {
    Promise.all(inputs.map((i) => i.autoDiscover(node)))
  }
}
