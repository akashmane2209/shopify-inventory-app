import {
  Card,
  DisplayText,
  Form,
  FormLayout,
  Layout,
  Page,
  PageActions,
  TextField,
  Banner,
  Toast
} from "@shopify/polaris";
import store from "store-js";
import gql from "graphql-tag";
import { Mutation, Query } from "react-apollo";

const UPDATE_INVENTORY = gql`
  mutation adjustInventoryLevelQuantity(
    $inventoryAdjustQuantityInput: InventoryAdjustQuantityInput!
  ) {
    inventoryAdjustQuantity(input: $inventoryAdjustQuantityInput) {
      inventoryLevel {
        available
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const GET_INVENTORY_BY_ITEM_ID = gql`
  query getInventoryItemByID($id: ID!) {
    inventoryItem(id: $id) {
      id
      inventoryLevels(first: 6) {
        edges {
          node {
            id
            available
          }
        }
      }
    }
  }
`;
class EditProduct extends React.Component {
  state = {
    discount: "",
    price: "",
    variantId: "",
    inventory: "",
    inventoryCount: 0,
    showToast: false,
    addInventory: 0,
    success: false
  };

  componentDidMount() {
    this.setState({ discount: this.itemToBeConsumed() });
  }

  render() {
    const {
      name,
      inventoryCount,
      discount,
      variantId,
      addInventory
    } = this.state;
    return (
      <Query
        query={GET_INVENTORY_BY_ITEM_ID}
        variables={{
          id: this.state.inventory
        }}
      >
        {({ data, loading, error }) => {
          if (loading) {
            return <div>Loading…</div>;
          }
          if (error) {
            return <div>{error.message}</div>;
          }
          store.set(
            "inventoryID",
            data.inventoryItem.inventoryLevels.edges[0].node.id
          );
          return (
            <Mutation mutation={UPDATE_INVENTORY}>
              {(handleSubmit, { error, data }) => {
                const showError = error && (
                  <Banner status="critical">{error.message}</Banner>
                );
                const showToast = data && data.productVariantUpdate && (
                  <Toast
                    content="Sucessfully updated"
                    onDismiss={() => this.setState({ showToast: false })}
                  />
                );
                return (
                  <Page>
                    <Layout>
                      <Layout.Section>{showError}</Layout.Section>

                      <Layout.Section>
                        <DisplayText size="large">{name}</DisplayText>
                        <Form>
                          <Card sectioned>
                            <FormLayout>
                              <FormLayout.Group>
                                <TextField
                                  value={inventoryCount}
                                  disabled={true}
                                  label="Original Quantity"
                                  type="number"
                                />
                                <TextField
                                  value={addInventory}
                                  onChange={this.handleChange("addInventory")}
                                  label="Increase Quantity"
                                  type="number"
                                />
                              </FormLayout.Group>
                              <p>Change Inventory for Products Made Easy</p>
                            </FormLayout>
                          </Card>

                          <PageActions
                            primaryAction={[
                              {
                                content: "Save",
                                onAction: () => {
                                  const inventoryAdjustQuantityInput = {
                                    inventoryLevelId: store.get("inventoryID"),
                                    availableDelta: parseInt(addInventory)
                                  };
                                  handleSubmit({
                                    variables: { inventoryAdjustQuantityInput }
                                  });
                                  this.setState({
                                    inventoryCount:
                                      parseInt(inventoryCount) +
                                      parseInt(addInventory)
                                  });
                                  this.setState({ success: true });
                                }
                              }
                            ]}
                          />
                          {this.state.success ? (
                            <p>Update successfully</p>
                          ) : (
                            <p></p>
                          )}
                        </Form>
                      </Layout.Section>
                    </Layout>
                  </Page>
                );
              }}
            </Mutation>
          );
        }}
      </Query>
    );
  }

  handleChange = field => {
    return value => this.setState({ [field]: value });
  };

  itemToBeConsumed = () => {
    const item = store.get("item");
    console.log(item);
    const price = item.variants.edges[0].node.price;
    const variantId = item.variants.edges[0].node.id;
    const discounter = price * 0.1;
    const inventory = item.variants.edges[0].node.inventoryItem.id;
    const inventoryCount = item.variants.edges[0].node.inventoryQuantity;

    this.setState({ price, variantId, inventory, inventoryCount });
    return (price - discounter).toFixed(2);
  };
}

export default EditProduct;
