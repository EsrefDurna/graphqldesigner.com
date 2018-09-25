import * as types from '../actions/action-types';

const initialState = {
  database: '',
  projectReset: true,
  tableIndex: 0,
  tables: {},
  selectedTable: {
    type: '',
    fields: {},
    fieldsIndex: 1,
    tableID: -1
  },
  selectedField: {
    name: '',
    type: 'String',
    primaryKey: false,
    unique: false,
    defaultValue: '',
    required: false,
    multipleValues: false,
    relationIndex: 0,
    relation: {
      type: '',
      field: '',
      refType: ''
    },
    refByIndex: 0,
    refBy: {},
    tableNum: -1,
    fieldNum: -1
  }
};

const reducers = (state = initialState, action) => {
  let newSelectedField;
  let newSelectedTable;
  let newTables;
  let newTable;
  let newState;
  let tableNum;
  let newTableData;
  let newFields;

  const tableReset = {
    type: '',
    fields: {},
    fieldsIndex: 1,
    tableID: -1
  };

  const fieldReset = {
    name: '',
    type: 'String',
    primaryKey: false,
    unique: false,
    defaultValue: '',
    required: false,
    multipleValues: false,
    relation: {
      type: '',
      field: '',
      refType: ''
    },
    refByIndex: 0,
    refBy: {},
    tableNum: -1,
    fieldNum: -1
  };

  const idDefault = {
    name: 'id',
    type: 'ID',
    primaryKey: true,
    unique: true,
    defaultValue: '',
    required: false,
    multipleValues: false,
    relation: {
      type: '',
      field: '',
      refType: ''
    },
    refByIndex: 0,
    refBy: {},
    tableNum: -1,
    fieldNum: 0
  };

  const mongoTable = Object.assign({}, tableReset, {
    fields: {
      0: Object.assign({}, idDefault, { tableNum: state.tableIndex })
    }
  });

  // action.payload is how you can access the info
  switch (action.type) {
    case types.CHOOSE_DATABASE:
      const database = action.payload;

      return {
        ...state,
        database
      };

    // ------------- Format to mongo onload -------------------//
    case 'TABLES_TO_MONGO_FORMAT':
      return {
        ...state,
        selectedTable: mongoTable
      };

    // ----------- Open Table Creator --------------//

    case types.OPEN_TABLE_CREATOR:
      newSelectedField = Object.assign({}, fieldReset);
      if (state.database === 'MongoDB') {
        newSelectedTable = Object.assign({}, mongoTable);
      } else {
        newSelectedTable = Object.assign({}, tableReset);
      }

      return {
        ...state,
        selectedTable: newSelectedTable,
        selectedField: newSelectedField
      };

    // ------------- Add Table ----------------//
    case types.SAVE_TABLE_DATA_INPUT:
      if (state.selectedTable.tableID < 0) {
        //SAVE A NEW TABLE
        newTable = Object.assign({}, state.selectedTable, { tableID: state.tableIndex });
        newTables = Object.assign({}, state.tables, { [state.tableIndex]: newTable });
        newState = Object.assign({}, state, {
          tableIndex: state.tableIndex + 1,
          tables: newTables,
          selectedTable: state.database === 'MongoDB' ? mongoTable : tableReset
        });

        if (state.database === 'MongoDB') newState.selectedTable.fields[0].tableNum++;
      } else {
        //UPDATE A SAVED TABLE
        newTableData = Object.assign({}, state.selectedTable);
        newTables = Object.assign({}, state.tables, { [state.selectedTable.tableID]: newTableData });
        newState = Object.assign({}, state, {
          tables: newTables,
          selectedTable: state.database === 'MongoDB' ? mongoTable : tableReset
        });
      }

      if (action.payload) {
      }
      return newState;

    // ------------ Change Table Name ----------------//
    case types.HANDLE_TABLE_NAME_CHANGE:
      newSelectedTable = Object.assign({}, state.selectedTable, { type: action.payload });

      return {
        ...state,
        selectedTable: newSelectedTable
      };

    // ------------ Change Table ID ----------------//
    case types.HANDLE_TABLE_ID:
      if (!!state.selectedTable.fields[0]) {
        newFields = Object.assign({}, state.selectedTable.fields);
        delete newFields[0];
        newSelectedTable = Object.assign({}, state.selectedTable, { fields: newFields });
      } else {
        newFields = Object.assign({}, state.selectedTable.fields, { 0: idDefault });

        if (state.selectedTable.tableID < 0) {
          newFields[0].tableNum = state.tableIndex;
        } else {
          newFields[0].tableNum = state.selectedTable.tableID;
        }
        newSelectedTable = Object.assign({}, state.selectedTable, { fields: newFields });
      }

      return {
        ...state,
        selectedTable: newSelectedTable
      };

    // ---------- Select Table For Update ------------//
    case types.HANDLE_SELECTED_TABLE:
      tableNum = Number(action.payload);

      newSelectedTable = Object.assign({}, state.tables[tableNum]);

      return {
        ...state,
        selectedTable: newSelectedTable,
        selectedField: fieldReset
        // selectedField: fieldReset //fieldReset is defined above the cases
      };

    // --------------- Delete Table ----------------//
    case types.DELETE_TABLE:
      tableNum = Number(action.payload);

      newTables = Object.assign({}, state.tables);
      delete newTables[tableNum];

      if (state.database === 'MongoDB') {
        newSelectedTable = Object.assign({}, mongoTable);
      } else {
        newSelectedTable = Object.assign({}, tableReset);
      }

      if (state.selectedField.tableNum === tableNum) {
        return {
          ...state,
          tables: newTables,
          selectedTable: newSelectedTable,
          selectedField: fieldReset
        };
      } else {
        if (state.selectedTable.tableID === tableNum) {
          return {
            ...state,
            tables: newTables,
            selectedTable: newSelectedTable
          };
        } else {
          return {
            ...state,
            tables: newTables
          };
        }
      }

    // ----------- Save Added or Updated Field ----------------//
    case types.SAVE_FIELD_INPUT:
      let newSelectedFieldName = state.selectedField.name;

      tableNum = state.selectedField.tableNum;
      const currentFieldIndex = state.tables[tableNum].fieldsIndex;
      // no field has been selected yet
      if (state.selectedField.fieldNum < 0) {
        newTables = Object.assign({}, state.tables, {
          [tableNum]: Object.assign(
            {},
            state.tables[tableNum],
            { fieldsIndex: currentFieldIndex + 1 },
            {
              fields: Object.assign({}, state.tables[tableNum].fields, {
                [currentFieldIndex]: Object.assign({}, state.selectedField, {
                  fieldNum: currentFieldIndex,
                  name: newSelectedFieldName
                })
              })
            }
          )
        });

        newSelectedField = Object.assign({}, fieldReset, { tableNum });
        return {
          ...state,
          tables: newTables,
          selectedField: newSelectedField
        };
      } else {
        // field has been selected
        newTables = Object.assign({}, state.tables, {
          [tableNum]: Object.assign(
            {},
            state.tables[tableNum],
            { fieldsIndex: currentFieldIndex },
            {
              fields: Object.assign({}, state.tables[tableNum].fields, {
                [state.selectedField.fieldNum]: Object.assign({}, state.selectedField, {
                  fieldNum: state.selectedField.fieldNum,
                  name: newSelectedFieldName
                })
              })
            }
          )
        });

        return {
          ...state,
          tables: newTables,
          selectedField: fieldReset
        };
      }

    // -------------- Delete Field ----------------//
    case types.DELETE_FIELD:
      tableNum = Number(action.payload[0]);
      const fieldNum = Number(action.payload[1]);
      if (state.selectedField.tableNum === tableNum && state.selectedField.fieldNum === fieldNum) {
        newTable = Object.assign({}, state.tables[tableNum]);
        delete newTable.fields[fieldNum];
        newTables = Object.assign({}, state.tables, { [tableNum]: newTable });

        return {
          ...state,
          tables: newTables,
          selectedField: fieldReset
        };
      } else {
        newTable = Object.assign({}, state.tables[tableNum]);
        delete newTable.fields[fieldNum];
        newTables = Object.assign({}, state.tables, { [tableNum]: newTable });

        return {
          ...state,
          tables: newTables
        };
      }

    // ------------ HANDLE FIELD UPDATE ----------------//
    // updates selected field on each data entry
    case types.HANDLE_FIELDS_UPDATE:
      // parse if relations field is selected
      if (action.payload.name.indexOf('.') !== -1) {
        const rel = action.payload.name.split('.'); // rel[0] is 'relation' and rel[1] is either 'type', 'field', or 'ref'type'
        newSelectedField = Object.assign({}, state.selectedField, {
          [rel[0]]: Object.assign({}, state.selectedField[rel[0]], { [rel[1]]: action.payload.value })
        });
      } else {
        if (action.payload.value === 'true') action.payload.value = true;
        if (action.payload.value === 'false') action.payload.value = false;
        newSelectedField = Object.assign({}, state.selectedField, {
          [action.payload.name]: action.payload.value
        });
      }
      return {
        ...state,
        selectedField: newSelectedField
      };

    // ------------ FIELD SELECTED FOR UPDATE ----------------//

    // when a user selects a field, it changes selectedField to be an object with the necessary
    // info from the selected table and field.
    case types.HANDLE_FIELDS_SELECT:
      // location contains the table index at [0], and field at [1]
      const location = action.payload.location.split(' ');

      newSelectedField = Object.assign({}, state.tables[Number(location[0])].fields[Number(location[1])]);

      if (state.database === 'MongoDB') {
        newSelectedTable = Object.assign({}, mongoTable);
      } else {
        newSelectedTable = Object.assign({}, tableReset);
      }

      return {
        ...state,
        selectedTable: newSelectedTable,
        selectedField: newSelectedField
      };
    // ------------ OPEN FIELD CREATOR ----------------//
    // Add Field in Table was clicked to display field options
    case types.ADD_FIELD_CLICKED:
      newSelectedField = fieldReset;
      newSelectedField.tableNum = Number(action.payload);

      return {
        ...state,
        selectedField: newSelectedField
      };

    // ------------ New Project ----------------//
    // User clicked New Project
    case types.HANDLE_NEW_PROJECT:
      newState = Object.assign({}, initialState, { projectReset: action.payload });

      return newState;

    default:
      return state;
  }
};

export default reducers;