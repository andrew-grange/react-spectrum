/*
 * Copyright 2020 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import {AriaButtonProps} from '@react-types/button';
import {AriaDatePickerProps, AriaDateRangePickerProps, DateValue} from '@react-types/datepicker';
import {AriaDialogProps} from '@react-types/dialog';
import {createFocusManager} from '@react-aria/focus';
import {DateRangePickerState} from '@react-stately/datepicker';
import {focusManagerSymbol, roleSymbol} from './useDateField';
import {HTMLAttributes, RefObject, useMemo} from 'react';
// @ts-ignore
import intlMessages from '../intl/*.json';
import {mergeProps, useDescription, useId} from '@react-aria/utils';
import {RangeCalendarProps} from '@react-types/calendar';
import {useDatePickerGroup} from './useDatePickerGroup';
import {useField} from '@react-aria/label';
import {useFocusWithin} from '@react-aria/interactions';
import {useLocale, useMessageFormatter} from '@react-aria/i18n';

interface DateRangePickerAria {
  /** Props for the date range picker's visible label element, if any. */
  labelProps: HTMLAttributes<HTMLElement>,
  /** Props for the grouping element containing the date fields and button. */
  groupProps: HTMLAttributes<HTMLElement>,
  /** Props for the start date field. */
  startFieldProps: AriaDatePickerProps<DateValue>,
  /** Props for the end date field. */
  endFieldProps: AriaDatePickerProps<DateValue>,
  /** Props for the popover trigger button. */
  buttonProps: AriaButtonProps,
  /** Props for the description element, if any. */
  descriptionProps: HTMLAttributes<HTMLElement>,
  /** Props for the error message element, if any. */
  errorMessageProps: HTMLAttributes<HTMLElement>,
  /** Props for the popover dialog. */
  dialogProps: AriaDialogProps,
  /** Props for the range calendar within the popover dialog. */
  calendarProps: RangeCalendarProps<DateValue>
}

/**
 * Provides the behavior and accessibility implementation for a date picker component.
 * A date range picker combines two DateFields and a RangeCalendar popover to allow
 * users to enter or select a date and time range.
 */
export function useDateRangePicker<T extends DateValue>(props: AriaDateRangePickerProps<T>, state: DateRangePickerState, ref: RefObject<HTMLElement>): DateRangePickerAria {
  let formatMessage = useMessageFormatter(intlMessages);
  let {labelProps, fieldProps, descriptionProps, errorMessageProps} = useField({
    ...props,
    labelElementType: 'span'
  });

  let labelledBy = fieldProps['aria-labelledby'] || fieldProps.id;

  let {locale} = useLocale();
  let description = state.formatValue(locale, {month: 'long'});
  let descProps = useDescription(description);

  let startFieldProps = {
    'aria-label': formatMessage('startDate'),
    'aria-labelledby': labelledBy
  };

  let endFieldProps = {
    'aria-label': formatMessage('endDate'),
    'aria-labelledby': labelledBy
  };

  let buttonId = useId();
  let dialogId = useId();

  let groupProps = useDatePickerGroup(state, ref);
  let {focusWithinProps} = useFocusWithin({
    onBlurWithin() {
      state.confirmPlaceholder();
    }
  });

  let ariaDescribedBy = [descProps['aria-describedby'], fieldProps['aria-describedby']].filter(Boolean).join(' ') || undefined;
  let focusManager = useMemo(() => createFocusManager(ref), [ref]);
  let commonFieldProps = {
    [focusManagerSymbol]: focusManager,
    [roleSymbol]: 'presentation',
    'aria-describedby': ariaDescribedBy,
    minValue: props.minValue,
    maxValue: props.maxValue,
    placeholderValue: props.placeholderValue,
    hideTimeZone: props.hideTimeZone,
    hourCycle: props.hourCycle,
    granularity: props.granularity,
    isDisabled: props.isDisabled,
    isReadOnly: props.isReadOnly,
    isRequired: props.isRequired,
    validationState: state.validationState
  };

  return {
    groupProps: mergeProps(groupProps, fieldProps, descProps, focusWithinProps, {
      role: 'group',
      'aria-disabled': props.isDisabled || null,
      'aria-describedby': ariaDescribedBy
    }),
    labelProps: {
      ...labelProps,
      onClick: () => {
        focusManager.focusFirst();
      }
    },
    buttonProps: {
      ...descProps,
      id: buttonId,
      excludeFromTabOrder: true,
      'aria-haspopup': 'dialog',
      'aria-label': formatMessage('calendar'),
      'aria-labelledby': `${labelledBy} ${buttonId}`,
      'aria-describedby': ariaDescribedBy,
      onPress: () => state.setOpen(true)
    },
    dialogProps: {
      id: dialogId,
      'aria-labelledby': `${labelledBy} ${buttonId}`
    },
    startFieldProps: {
      ...startFieldProps,
      ...commonFieldProps,
      value: state.value?.start,
      onChange: start => state.setDateTime('start', start),
      autoFocus: props.autoFocus
    },
    endFieldProps: {
      ...endFieldProps,
      ...commonFieldProps,
      value: state.value?.end,
      onChange: end => state.setDateTime('end', end)
    },
    descriptionProps,
    errorMessageProps,
    calendarProps: {
      autoFocus: true,
      value: state.dateRange,
      onChange: state.setDateRange,
      minValue: props.minValue,
      maxValue: props.maxValue,
      isDisabled: props.isDisabled,
      isReadOnly: props.isReadOnly,
      isDateUnavailable: props.isDateUnavailable,
      allowsNonContiguousRanges: props.allowsNonContiguousRanges,
      defaultFocusedValue: state.dateRange ? undefined : props.placeholderValue,
      validationState: state.validationState,
      errorMessage: props.errorMessage
    }
  };
}
